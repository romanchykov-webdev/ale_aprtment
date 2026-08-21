import { useFrameProgress } from '@/lib/frame-progress';
import { cn } from '@/lib/utils';
import { motion, useTransform } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Показывает children строго в заданном диапазоне кадров прогулки.
 *
 * Диапазоны задаются вручную в JSX и намеренно НЕ выводятся из математики
 * клипов: границы подбираются глазами по dev-счётчику кадров, потому что
 * решение «когда появиться» — режиссёрское, а не арифметическое.
 *
 * Внутри нет ни одного useState. Всё, что меняется при прокрутке, — это
 * MotionValue, которые правят стиль в обход React. За всю прокрутку компонент
 * не рендерится ни разу.
 */

export type FrameEffect =
    | 'fade'
    | 'fade-out'
    | 'fade-left'
    | 'fade-right'
    | 'fade-up'
    | 'fade-down'
    | 'scale-up'
    | 'scale-down';

/** Состояние слоя в момент, когда он ещё не пришёл или уже ушёл. */
interface EffectOffset {
    x: number;
    y: number;
    scale: number;
}

/**
 * Одна таблица обслуживает и вход, и выход — эффект описывает не направление
 * движения, а точку, из которой слой приходит или в которую уходит.
 */
const EFFECTS = {
    fade: { x: 0, y: 0, scale: 1 },
    'fade-out': { x: 0, y: 0, scale: 1 },
    'fade-left': { x: -64, y: 0, scale: 1 },
    'fade-right': { x: 64, y: 0, scale: 1 },
    'fade-up': { x: 0, y: 48, scale: 1 },
    'fade-down': { x: 0, y: -48, scale: 1 },
    'scale-up': { x: 0, y: 0, scale: 0.92 },
    'scale-down': { x: 0, y: 0, scale: 1.08 },
} as const satisfies Record<FrameEffect, EffectOffset>;

/** Сколько кадров по умолчанию занимает появление и исчезновение. */
const DEFAULT_TRANSITION_FRAMES = 8;

/** Ниже этого слой считается погасшим и убирается из композитинга. */
const HIDDEN_THRESHOLD = 0.01;
/** Выше этого слой считается пришедшим и начинает принимать клики. */
const INTERACTIVE_THRESHOLD = 0.99;

export interface FrameObserverProps {
    /** Кадр, на котором слой начинает появляться. */
    startFrame: number;
    /** Кадр, на котором слой окончательно погас. */
    endFrame: number;
    inEffect?: FrameEffect;
    outEffect?: FrameEffect;
    /** Длительность появления в кадрах. */
    inFrames?: number;
    /** Длительность исчезновения в кадрах. */
    outFrames?: number;
    /** Позиционирование внутри сцены задаёт страница, а не сам баннер. */
    className?: string;
    children: ReactNode;
}

export function FrameObserver({
    startFrame,
    endFrame,
    inEffect = 'fade',
    outEffect = 'fade-out',
    inFrames = DEFAULT_TRANSITION_FRAMES,
    outFrames = DEFAULT_TRANSITION_FRAMES,
    className,
    children,
}: FrameObserverProps) {
    const frame = useFrameProgress();

    const span = endFrame - startFrame;

    if (import.meta.env.DEV && span <= 0) {
        console.warn(
            `FrameObserver: endFrame (${endFrame}) должен быть больше startFrame (${startFrame}). Слой показан не будет.`
        );
    }

    // useTransform молча выдаёт мусор, если точки входного массива не строго
    // возрастают. Две фазы вместе не должны съедать больше всего диапазона,
    // иначе на коротком отрезке стопы схлопнутся или пойдут вспять.
    const half = Math.max(span / 2, 0);
    const enter = Math.min(Math.max(inFrames, 0), half);
    const exit = Math.min(Math.max(outFrames, 0), half);

    const from = EFFECTS[inEffect];
    const to = EFFECTS[outEffect];

    // Четыре опорные точки: пришёл — держится — уходит.
    const stops = [startFrame, startFrame + enter, endFrame - exit, endFrame];

    const opacity = useTransform(frame, stops, [0, 1, 1, 0]);
    const x = useTransform(frame, stops, [from.x, 0, 0, to.x]);
    const y = useTransform(frame, stops, [from.y, 0, 0, to.y]);
    const scale = useTransform(frame, stops, [from.scale, 1, 1, to.scale]);

    //   // Погашенный слой обязан уйти из композитинга: иначе пять полноэкранных
    //   // панелей с backdrop-filter висят в памяти видеокарты всю прокрутку.
    //   const visibility = useTransform(opacity, (value) =>
    //     value < HIDDEN_THRESHOLD ? 'hidden' : 'visible',
    //   );
    //   // И не должен перехватывать клики, пока не виден полностью.
    //   const pointerEvents = useTransform(opacity, (value) =>
    //     value > INTERACTIVE_THRESHOLD ? 'auto' : 'none',
    //   );

    //   return (
    //     <motion.div
    //       className={cn('absolute inset-0 flex', className)}
    //       style={{ opacity, x, y, scale, visibility, pointerEvents }}
    //     >
    //       {children}
    //     </motion.div>
    //   );
    // Погашенный слой обязан уйти из композитинга
    const visibility = useTransform(opacity, value =>
        value < HIDDEN_THRESHOLD ? 'hidden' : 'visible'
    );
    // И не должен перехватывать клики, пока не виден полностью
    const pointerEvents = useTransform(opacity, value =>
        value > INTERACTIVE_THRESHOLD ? 'auto' : 'none'
    );

    return (
        <motion.div
            className={cn(
                'absolute inset-0 flex items-center justify-center p-4',
                className
            )}
            style={{ opacity, visibility, pointerEvents }}
        >
            {/* 
      СЛОЙ 2: Контент. 
      Двигает саму карточку (x, y, scale) независимо от фона подложки. 
    */}
            <motion.div style={{ x, y, scale }}>{children}</motion.div>
        </motion.div>
    );
}
