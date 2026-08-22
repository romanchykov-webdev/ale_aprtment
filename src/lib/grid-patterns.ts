import type { GridPattern } from './mockDb';

/**
 * Словарь паттернов для Bento-галереи.
 * Mobile-first подход: по умолчанию сетка состоит из 2 колонок.
 * На десктопе (md:) сетка расширяется до 4 колонок.
 */
export function getGridItemClass(pattern: GridPattern, index: number): string {
  // Базовый класс для стандартной квадратной ячейки (1x1)
  const baseClass = 'col-span-1 md:col-span-1 md:row-span-1';

  switch (pattern) {
    case 'hero-left':
      // 0: Высокая слева (на мобилке широкая, на десктопе высокая)
      if (index === 0) return 'col-span-2 md:col-span-1 md:row-span-2';
      // 1: Широкая сверху (занимает 2 колонки на десктопе)
      if (index === 1) return 'col-span-2 md:col-span-2 md:row-span-1';
      // Остальные стандартные
      return baseClass;

    case 'panorama-top':
      // 0: Огромная панорама на всю ширину (4 колонки)
      if (index === 0) return 'col-span-2 md:col-span-4 md:row-span-1';
      // 1 и 2: Чуть шире остальных
      if (index === 1 || index === 2) return 'col-span-1 md:col-span-2 md:row-span-1';
      // Остальные стандартные
      return baseClass;

    case 'vertical-split':
      // 0 и 1: Две высокие фотографии рядом
      if (index === 0 || index === 1) return 'col-span-1 md:col-span-2 md:row-span-2';
      // Остальные стандартные
      return baseClass;

    default:
      return baseClass;
  }
}
