import { BannerDismissContext, type BannerDismissApi } from '@/lib/banner-dismiss';
import { useFrameProgress } from '@/lib/frame-progress';
import { cn } from '@/lib/utils';
import type { MotionValue } from 'motion/react';
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useTransform,
} from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/**
 * Показывает children строго в заданном диапазоне кадров прогулки.
 *
 * Диапазоны задаются вручную в JSX и намеренно НЕ выводятся из математики
 * клипов: границы подбираются глазами по dev-счётчику кадров, потому что
 * решение «когда появиться» — режиссёрское, а не арифметическое.
 *
 * Всё, что меняется при ПРОКРУТКЕ, — это MotionValue, которые правят стиль в
 * обход React. За всю прокрутку компонент не рендерится ни разу. Единственный
 * useState здесь — закрытие плашки крестиком: он меняется по клику человека,
 * то есть считаные разы за сессию, и на скролл-путь не влияет (см. guard в
 * useFrameDismiss).
 *
 * Три слоя, у каждого стилевого канала ровно один владелец — иначе Motion и
 * React дерутся за один и тот же inline-стиль:
 *   L1 — скрим и прозрачность слоя. Владелец — скролл (× множитель закрытия).
 *   L2 — вход/выход карточки (x, y, scale). Владелец — скролл.
 *   L3 — уход по клику. Владелец — AnimatePresence.
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

/**
 * Уход по клику. Коротко и с ease-out: панель со стеклом перерисовывает блюр
 * каждый кадр анимации, длинный уход выходит дорого и выглядит вязко.
 */
const DISMISS_DURATION = 0.22;
const DISMISS_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
/** Насколько карточка подбирается, уходя. Скрим при этом просто гаснет. */
const DISMISS_SCALE = 0.96;

interface FrameDismiss {
    /** Закрыта ли плашка прямо сейчас. Меняется только по клику и по сбросу. */
    dismissed: boolean;
    /** 1 — плашка на месте, 0 — закрыта. Множитель к скролловой прозрачности. */
    amount: MotionValue<number>;
    close: () => void;
}

/**
 * Стейт закрытия и «воскрешение» плашки.
 *
 * Сброс слушает НЕ кадр, а уже посчитанную скролловую прозрачность: во-первых,
 * это не дублирует арифметику границ, которую компонент выше уже проделал;
 * во-вторых, снимает дребезг на границе диапазона. Скруббер публикует
 * сглаженную позицию, догоняющую цель по экспоненте, поэтому у самого endFrame
 * значение колеблется — сброс по сырому сравнению с endFrame давал бы вспышку
 * только что закрытой плашки посреди её же fade-out. Порог HIDDEN_THRESHOLD
 * гарантирует, что к моменту сброса слой уже физически невидим.
 *
 * Важно, что сюда передаётся именно скролловая прозрачность, до умножения на
 * amount. Иначе закрытие само уронило бы opacity в ноль, сброс тут же счёл бы
 * слой покинутым — и плашка воскресала бы под пальцем.
 */
function useFrameDismiss(
    frameOpacity: MotionValue<number>,
    reducedMotion: boolean
): FrameDismiss {
    const [dismissed, setDismissed] = useState(false);
    const amount = useMotionValue(1);

    // Зеркало стейта в ref. Колбэк ниже вызывается на каждом кадре rAF —
    // тысячи раз за прокрутку. Читать стейт из замыкания нельзя (устареет),
    // а безусловный setState гонял бы React по bail-out-пути на каждом кадре.
    // Ref позволяет выйти из колбэка первой же строкой.
    const dismissedRef = useRef(false);

    // Анимацию ухода надо уметь оборвать: сброс может прийти раньше, чем она
    // договорит. Храним именно стоп-функцию — тип AnimationPlaybackControls
    // наружу из motion/react не реэкспортируется.
    const stopRef = useRef<(() => void) | null>(null);

    const close = useCallback(() => {
        if (dismissedRef.current) return;
        dismissedRef.current = true;
        setDismissed(true);

        stopRef.current?.();
        const controls = animate(amount, 0, {
            duration: reducedMotion ? 0 : DISMISS_DURATION,
            ease: DISMISS_EASE,
        });
        stopRef.current = () => controls.stop();
    }, [amount, reducedMotion]);

    useMotionValueEvent(frameOpacity, 'change', value => {
        if (!dismissedRef.current) return; // 99.99% вызовов заканчиваются здесь
        if (value >= HIDDEN_THRESHOLD) return;

        // Слой невидим — возвращать множитель можно рывком, без анимации.
        stopRef.current?.();
        stopRef.current = null;
        amount.set(1);
        dismissedRef.current = false;
        setDismissed(false);
    });

    useEffect(() => () => stopRef.current?.(), []);

    return { dismissed, amount, close };
}

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
    const reducedMotion = useReducedMotion() === true;

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

    const frameOpacity = useTransform(frame, stops, [0, 1, 1, 0]);
    const x = useTransform(frame, stops, [from.x, 0, 0, to.x]);
    const y = useTransform(frame, stops, [from.y, 0, 0, to.y]);
    const scale = useTransform(frame, stops, [from.scale, 1, 1, to.scale]);

    const { dismissed, amount, close } = useFrameDismiss(frameOpacity, reducedMotion);

    // Прозрачность слоя — произведение двух независимых источников: положения
    // в прогулке и закрытия крестиком. Композиция, а не спор за канал: у
    // opacity по-прежнему один владелец — вот этот useTransform.
    //
    // Через него же гаснет скрим: градиент лежит на L1, и если гасить только
    // карточку, на кадре осталось бы тёмное пятно ровно там, где человек
    // освобождал обзор.
    const opacity = useTransform<number, number>(
        [frameOpacity, amount],
        ([frameValue, dismissValue]) => frameValue * dismissValue
    );

    // Погашенный слой обязан уйти из композитинга: иначе пять полноэкранных
    // панелей с backdrop-filter висят в памяти видеокарты всю прокрутку.
    // Закрытая плашка попадает под то же правило бесплатно.
    const visibility = useTransform(opacity, value =>
        value < HIDDEN_THRESHOLD ? 'hidden' : 'visible'
    );
    // И не должен перехватывать клики, пока не виден полностью.
    const pointerEvents = useTransform(opacity, value =>
        value > INTERACTIVE_THRESHOLD ? 'auto' : 'none'
    );

    const dismissApi = useMemo<BannerDismissApi>(() => ({ close }), [close]);

    return (
        <BannerDismissContext value={dismissApi}>
            {/* L1 — скрим и прозрачность слоя. Владелец стиля: скролл. */}
            <motion.div
                className={cn(
                    'absolute inset-0 flex items-center justify-center p-4',
                    className
                )}
                style={{ opacity, visibility, pointerEvents }}
            >
                {/* L2 — вход и выход карточки по кадрам, независимо от скрима.
                    Здесь же мгновенная блокировка кликов: узел под
                    AnimatePresence уже уходит и новых пропов не получит,
                    поэтому снимать клики надо на предке, который рендерится
                    синхронно с dismissed. Класс не конфликтует с inline-стилем
                    L1 — это разные узлы. */}
                <motion.div
                    style={{ x, y, scale }}
                    className={cn(dismissed && 'pointer-events-none')}
                >
                    {/* L3 — уход по клику. Владелец стиля: AnimatePresence.
                        Анимирует только scale: прозрачность на этом отрезке уже
                        ведёт L1, дважды гасить один канал незачем. */}
                    <AnimatePresence initial={false}>
                        {!dismissed && (
                            <motion.div
                                key="banner"
                                animate={{ scale: 1 }}
                                exit={{ scale: reducedMotion ? 1 : DISMISS_SCALE }}
                                transition={{
                                    duration: reducedMotion ? 0 : DISMISS_DURATION,
                                    ease: DISMISS_EASE,
                                }}
                            >
                                {children}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </BannerDismissContext>
    );
}
