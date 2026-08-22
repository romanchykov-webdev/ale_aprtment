import { BrandMark } from '@/components/layout/BrandMark';
import { type Agent, type NavItem, type Property, type UiCopy } from '@/lib/mockDb';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';

/**
 * Шапка, уезжающая вверх при прокрутке вниз и возвращающаяся при прокрутке
 * вверх.
 *
 * Здесь прокрутка — это таймкод прогулки, а не пролистывание ленты, поэтому
 * реакция намеренно загрублена: пока сдвиг не превысил DEAD_ZONE, направление
 * не пересматривается. Без порога шапка мельтешила бы на каждом дрожании
 * колеса и трекпада.
 *
 * Про производительность. Скролл здесь слушается через useMotionValueEvent, а
 * не через onScroll → setState: колбэк дёргается на каждом кадре, но setState
 * внутри срабатывает только когда направление реально сменилось, то есть
 * единицы раз за сессию вместо тысяч. Подписку снимает сам хук при
 * размонтировании — ручной removeEventListener не нужен и утечки нет.
 */

/** Сдвиг меньше этого не считается сменой направления, px. */
const DEAD_ZONE = 10;
/** Выше этой отметки шапка видна всегда, px. */
const ALWAYS_VISIBLE_ABOVE = 100;
/** На каком отрезке прокрутки фон набирает плотность, px. */
const BACKDROP_RAMP = [0, 80];

interface HeaderProps {
  agent?: Agent;
  property: Property;
  nav: readonly NavItem[];
  ui: UiCopy;
}

export function Header({ nav, ui }: HeaderProps) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Фон появляется без единого ререндера — чистая интерполяция MotionValue.
  const backgroundColor = useTransform(scrollY, BACKDROP_RAMP, [
    'rgba(10, 10, 11, 0)',
    'rgba(10, 10, 11, 0.72)',
  ]);
  const backdropFilter = useTransform(scrollY, BACKDROP_RAMP, [
    'blur(0px) saturate(100%)',
    'blur(28px) saturate(130%)',
  ]);
  const borderColor = useTransform(scrollY, BACKDROP_RAMP, [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.12)',
  ]);

  useMotionValueEvent(scrollY, 'change', y => {
    if (y <= ALWAYS_VISIBLE_ABOVE) {
      lastY.current = y;
      setHidden(was => (was ? false : was));
      return;
    }

    const previous = lastY.current;
    if (Math.abs(y - previous) < DEAD_ZONE) return;
    lastY.current = y;

    const shouldHide = y > previous;
    // Форма с prev: колбэк живёт всё время жизни компонента и не должен
    // опираться на значение hidden, захваченное при подписке.
    setHidden(was => (was === shouldHide ? was : shouldHide));
  });

  // плавный скролл к якорю
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    // 1. Убиваем стандартное поведение браузера (отменяем мгновенный прыжок)
    e.preventDefault();

    // 2. Ищем в DOM-дереве невидимый спан-якорь, который генерирует наш ScrollScrubber
    const element = document.getElementById(targetId);

    if (element) {
      // 3. Заставляем браузер плавно прокрутить страницу до этого спана
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header
      /* Затемнение сверху нужно всегда: на первом кадре под шапкой светлое
         небо, и без него белый текст по нему не читается. Стеклянный фон
         ниже проявляется поверх него по мере прокрутки. */
      className="fixed inset-x-0 top-0 z-50 border-b bg-linear-to-b from-ink/75 via-ink/35 to-transparent"
      style={{
        backgroundColor,
        backdropFilter,
        WebkitBackdropFilter: backdropFilter,
        borderColor,
      }}
      initial={false}
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className="mx-auto flex max-w-352 items-center gap-6 px-[clamp(1rem,4vw,3rem)] py-4">
        <a
          href="#tour"
          onClick={e => handleSmoothScroll(e, 'tour')}
          className="flex items-center gap-3 text-foam transition-colors hover:text-champagne"
        >
          <BrandMark className="size-6 shrink-0" />
          <span className="text-[11px] font-normal tracking-[0.28em] whitespace-nowrap uppercase">
            {ui.brandName}
          </span>
        </a>

        <nav aria-label={ui.navLabel} className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-8">
            {nav.map(item => (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={e => handleSmoothScroll(e, item.id)}
                  className="text-[10px] font-normal tracking-[0.28em] text-mist uppercase transition-colors hover:text-champagne"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </motion.header>
  );
}
