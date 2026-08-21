import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FRAMES_PER_CLIP } from '@/generated/frameManifest';
import { LQIP_DATA_URI } from '@/generated/lqip';
import { drawCoverFrame } from '@/lib/cover';
import { FrameLoader } from '@/lib/frameLoader';
import { useFrameProgress } from '@/lib/frame-progress';
import { resolveTier } from '@/lib/tier';
import { buildTimeline, type RenderPlan } from '@/lib/timeline';
// ВРЕМЕННО: dev-счётчик кадров, в прод-сборку не попадает.
import { FrameCounter, type FrameCounterHandle } from './FrameCounter';

const VH_PER_CLIP = 100;
const LOOKBEHIND = 8;
const LOOKAHEAD = 24;
const MAX_DPR = 2;

/** How much of the remaining distance the eased position covers each frame. */
const EASE = 0.12;
/** Below this the position has effectively arrived, so the loop can stop. */
const SETTLE_EPSILON = 0.01;

/** How far to look for a stand-in when the exact frame has not arrived yet. */
const FALLBACK_SEARCH_RADIUS = 16;

const timeline = buildTimeline(FRAMES_PER_CLIP);

function planKey(plan: RenderPlan): string {
  return `${plan.a}|${plan.b}|${Math.round(plan.mix * 64)}`;
}

/** Невидимая цель для якорной ссылки из шапки. */
export interface ScrollAnchor {
  id: string;
  /** Доля прокрутки прогулки, 0…1. */
  at: number;
}

interface ScrollScrubberProps {
  /** Оверлеи сцены. Кто и когда показывается — решают они сами. */
  children?: ReactNode;
  /** Описание прогулки для скринридеров. */
  ariaLabel: string;
  /** Подсказка «листайте вниз» на первом экране. */
  scrollHint: string;
  /** Куда ведут пункты навигации. */
  anchors?: readonly ScrollAnchor[];
}

export function ScrollScrubber({
  children,
  ariaLabel,
  scrollHint,
  anchors = [],
}: ScrollScrubberProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [painted, setPainted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Позиция прогулки для оверлеев. Это MotionValue, а не стейт: ниже она
  // обновляется на каждом кадре rAF, и ререндер там был бы недопустим.
  const frameProgress = useFrameProgress();
  // ВРЕМЕННО: см. FrameCounter.tsx.
  const frameCounterRef = useRef<FrameCounterHandle>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !sticky || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const loader = new FrameLoader(resolveTier());
    const maxPos = timeline.totalUnits - 1;

    let targetPos = 0;
    let currentPos = 0;
    let rafId: number | null = null;
    let lastKey = '';
    let lastPrefetchIndex = -1;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = 'high';
    };

    const nearestLoaded = (index: number): ImageBitmap | undefined => {
      for (let d = 1; d <= FALLBACK_SEARCH_RADIUS; d++) {
        const before = loader.getFrame(index - d);
        if (before) return before;
        const after = loader.getFrame(index + d);
        if (after) return after;
      }
      return undefined;
    };

    /**
     * Публикует позицию для оверлеев.
     *
     * Обязана вызываться ДО раннего выхода из render(): иначе при
     * субкадровом движении, когда канвасу перерисовывать нечего, баннеры
     * замирали бы на месте.
     */
    const publishPosition = (pos: number, plan: RenderPlan) => {
      frameProgress.set(timeline.resolveFrame(pos));
      // ВРЕМЕННО: dev-счётчик.
      frameCounterRef.current?.update({
        pos,
        frame: plan.a,
        blend: plan.b,
        mix: plan.mix,
      });
    };

    const render = (pos: number, force = false) => {
      const plan = timeline.resolve(pos);
      publishPosition(pos, plan);

      const key = planKey(plan);
      if (!force && key === lastKey) return;

      const exactA = loader.getFrame(plan.a);
      const bitmapA = exactA ?? nearestLoaded(plan.a);
      // Nothing usable yet — leave whatever is already on the canvas rather
      // than blanking it.
      if (!bitmapA) return;

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;

      ctx.globalAlpha = 1;
      drawCoverFrame(ctx, bitmapA, cssW, cssH);

      let complete = exactA !== undefined;

      if (plan.b !== null) {
        const bitmapB = loader.getFrame(plan.b);
        if (bitmapB) {
          ctx.globalAlpha = plan.mix;
          drawCoverFrame(ctx, bitmapB, cssW, cssH);
          ctx.globalAlpha = 1;
        } else {
          complete = false;
        }
      }

      // Only treat the plan as drawn once every layer it asked for was
      // available, so a stand-in gets replaced when the real frame lands.
      if (complete) lastKey = key;
      setPainted(true);
    };

    const prefetchAround = (pos: number) => {
      const plan = timeline.resolve(pos);
      if (plan.a === lastPrefetchIndex) return;
      lastPrefetchIndex = plan.a;

      loader.setCurrentIndex(plan.a);
      loader.pin(plan.b === null ? [plan.a] : [plan.a, plan.b]);
      // In a transition `b` is always `a + TRANSITION`, so one window covers
      // both layers.
      loader.requestFrames(plan.a - LOOKBEHIND, plan.a + LOOKAHEAD, 'high');
    };

    const tick = () => {
      const diff = targetPos - currentPos;
      if (Math.abs(diff) < SETTLE_EPSILON) {
        currentPos = targetPos;
        render(currentPos);
        rafId = null;
        return;
      }
      currentPos += diff * EASE;
      render(currentPos);
      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafId === null) rafId = requestAnimationFrame(tick);
    };

    const readTargetPos = () => {
      // Measuring the sticky element rather than window.innerHeight keeps the
      // JS maths and the CSS height on one source of truth, so a collapsing
      // mobile URL bar cannot desynchronise them.
      const scrollable = wrapper.offsetHeight - sticky.offsetHeight;
      if (scrollable <= 0) return 0;
      const scrolledPast = -wrapper.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, scrolledPast / scrollable));
      return progress * maxPos;
    };

    const onScroll = () => {
      targetPos = readTargetPos();
      prefetchAround(targetPos);
      if (window.scrollY > 8) setScrolled(true);
      startLoop();
    };

    loader.setOnFrameReady(() => {
      // While the loop runs the next tick repaints anyway; this matters once it
      // has settled and a stand-in is still on screen.
      if (rafId === null) render(currentPos, true);
    });

    resizeCanvas();
    targetPos = readTargetPos();
    currentPos = targetPos;
    prefetchAround(currentPos);
    // Первый render() случится только когда подъедет кадр, а страницу могли
    // перезагрузить в середине прокрутки — тогда оверлеи не должны мигнуть.
    publishPosition(currentPos, timeline.resolve(currentPos));

    const idleFill = () => {
      loader.requestFrames(0, FRAMES_PER_CLIP[0] - 1, 'low');
    };
    // requestIdleCallback is still missing on some Safari versions.
    const requestIdle: typeof window.requestIdleCallback | undefined = window.requestIdleCallback;
    let cancelIdle: () => void;
    if (requestIdle) {
      const handle = requestIdle(idleFill);
      cancelIdle = () => window.cancelIdleCallback(handle);
    } else {
      const handle = window.setTimeout(idleFill, 200);
      cancelIdle = () => window.clearTimeout(handle);
    }

    const observer = new ResizeObserver(() => {
      resizeCanvas();
      targetPos = readTargetPos();
      currentPos = targetPos;
      render(currentPos, true);
    });
    observer.observe(sticky);

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      cancelIdle();
      loader.dispose();
    };
    // frameProgress — тот же объект на всё время жизни компонента, поэтому
    // эффект по-прежнему отрабатывает ровно один раз.
  }, [frameProgress]);

  return (
    <div
      ref={wrapperRef}
      className="scrubber"
      style={{ height: `${VH_PER_CLIP * FRAMES_PER_CLIP.length}svh` }}
    >
      {/* Цели для якорей из шапки: своих секций у сцены нет, поэтому позиции
          на длинной обёртке — единственное, к чему можно привязаться. */}
      {anchors.map((anchor) => (
        <span
          key={anchor.id}
          id={anchor.id}
          className="pointer-events-none absolute left-0 h-px w-px"
          style={{ top: `${anchor.at * 100}%` }}
          aria-hidden="true"
        />
      ))}
      <div
        ref={stickyRef}
        className="scrubber__stage"
        style={{ backgroundImage: `url(${LQIP_DATA_URI})` }}
      >
        <canvas ref={canvasRef} className="scrubber__canvas" role="img" aria-label={ariaLabel} />
        {children}
        {/* ВРЕМЕННО: только в dev-режиме. */}
        {import.meta.env.DEV && <FrameCounter ref={frameCounterRef} />}
        {!painted && <div className="scrubber__spinner" aria-hidden="true" />}
        <div className="scrubber__hint" data-hidden={scrolled} aria-hidden="true">
          <span>{scrollHint}</span>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
