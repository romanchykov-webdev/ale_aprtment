import type { ReactNode } from 'react';
import { useMotionValue } from 'motion/react';
import { FrameProgressContext } from '@/lib/frame-progress';

interface FrameProgressProviderProps {
  children: ReactNode;
}

/** Владеет позицией прогулки. Пишет в неё скруббер, читают оверлеи. */
export function FrameProgressProvider({ children }: FrameProgressProviderProps) {
  // useMotionValue возвращает один и тот же объект на всё время жизни
  // компонента, поэтому значение контекста стабильно и не инвалидирует
  // подписчиков. Оборачивать в useMemo нечего.
  const frame = useMotionValue(0);

  return <FrameProgressContext value={frame}>{children}</FrameProgressContext>;
}
