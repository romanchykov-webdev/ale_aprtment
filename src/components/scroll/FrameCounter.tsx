import { useImperativeHandle, useRef, type RefObject } from 'react';
import { FRAME_COUNT } from '@/generated/frameManifest';
import './FrameCounter.css';

/**
 * Инструмент разработки — рендерится только при import.meta.env.DEV
 * (см. ScrollScrubber.tsx) и в продакшен-сборку не попадает.
 *
 * Показывает, какой кадр сейчас на канвасе: номер кадра, позицию на таймлайне
 * и параметры перехода между клипами.
 *
 * Удалять его не планируется. Границы startFrame/endFrame у каждого
 * FrameObserver подбираются вручную, и подобрать их без этого счётчика можно
 * только пересчитывая кадры на глаз. После каждой перегенерации кадров
 * скриптом extract-frames.sh границы придётся сверять заново — тоже по нему.
 *
 * Значения пишутся напрямую в DOM, а не через useState: render() в скруббере
 * вызывается на каждом кадре requestAnimationFrame, и ререндер React там был
 * бы заметен на прокрутке.
 */

export interface FrameInfo {
  /** Позиция на таймлайне (виртуальные единицы, дробная). */
  pos: number;
  /** Основной кадр — слой `a`. */
  frame: number;
  /** Второй кадр во время склейки клипов, иначе null. */
  blend: number | null;
  /** Непрозрачность слоя `b`: 0—1. */
  mix: number;
}

interface FrameCounterProps {
  ref?: RefObject<FrameCounterHandle | null>;
}

export interface FrameCounterHandle {
  update(info: FrameInfo): void;
}

export function FrameCounter({ ref }: FrameCounterProps) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const posRef = useRef<HTMLSpanElement>(null);
  const blendRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    update({ pos, frame, blend, mix }: FrameInfo) {
      if (frameRef.current) {
        frameRef.current.textContent = String(frame);
      }
      if (posRef.current) {
        posRef.current.textContent = pos.toFixed(1);
      }
      if (blendRef.current) {
        blendRef.current.textContent =
          blend === null ? '—' : `${blend} · ${Math.round(mix * 100)}%`;
      }
    },
  }));

  return (
    <div className="frame-counter" aria-hidden="true">
      <div className="frame-counter__row">
        <span className="frame-counter__label">frame</span>
        <span className="frame-counter__value" ref={frameRef}>
          0
        </span>
        <span className="frame-counter__total">/ {FRAME_COUNT - 1}</span>
      </div>
      <div className="frame-counter__row">
        <span className="frame-counter__label">pos</span>
        <span className="frame-counter__value" ref={posRef}>
          0.0
        </span>
      </div>
      <div className="frame-counter__row">
        <span className="frame-counter__label">blend</span>
        <span className="frame-counter__value" ref={blendRef}>
          —
        </span>
      </div>
    </div>
  );
}
