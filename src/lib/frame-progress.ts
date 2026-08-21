import { createContext, useContext } from 'react';
import type { MotionValue } from 'motion/react';

/**
 * Общая позиция прогулки — сквозной индекс кадра, дробный.
 *
 * Система координат та же, что у FrameCounter: 0 — первый кадр первого клипа,
 * FRAME_COUNT - 1 — последний кадр последнего. Это НЕ единицы таймлайна,
 * которых меньше из-за кросс-фейдов между клипами.
 *
 * Почему MotionValue, а не стейт. Скруббер обновляет позицию на каждом кадре
 * requestAnimationFrame — со стейтом это были бы тысячи ререндеров за одну
 * прокрутку. MotionValue живёт вне React: .set() пишет значение и дёргает
 * подписчиков, которые правят стиль напрямую, минуя рендер и reconciliation.
 *
 * Почему не useScroll из Framer Motion. Скруббер рисует не сырой скролл, а
 * сглаженную позицию, догоняющую цель по экспоненте. Оверлеи, привязанные к
 * сырому скроллу, при резком движении обгоняли бы картинку на полтора десятка
 * кадров. Здесь публикуется именно то значение, которое сейчас на канвасе.
 *
 * Провайдер лежит рядом, в FrameProgressProvider.tsx: держать компонент и
 * хук в одном файле мешает Fast Refresh.
 */
export const FrameProgressContext = createContext<MotionValue<number> | null>(null);

export function useFrameProgress(): MotionValue<number> {
  const frame = useContext(FrameProgressContext);
  if (frame === null) {
    throw new Error(
      'useFrameProgress вызван вне FrameProgressProvider. Оберните прогулку в <FrameProgressProvider>.',
    );
  }
  return frame;
}
