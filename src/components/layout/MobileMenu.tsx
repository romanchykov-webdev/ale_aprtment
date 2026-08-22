import { type Agent, type NavItem, type UiCopy } from '@/lib/mockDb';
import { Home, X } from 'lucide-react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useEffect } from 'react';
// Возвращаем импорт обычной кнопки
import { Button } from '@/components/ui/button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  nav: readonly NavItem[];
  agent: Agent;
  ui: UiCopy;

  onBookingClick: () => void;
}

const overlayVariants: Variants = {
  closed: { opacity: 0, backdropFilter: 'blur(0px)' },
  open: { opacity: 1, backdropFilter: 'blur(16px)', transition: { duration: 0.4 } },
};

const panelVariants: Variants = {
  closed: {
    x: '100%',
    transition: { ease: [0.32, 0.72, 0, 1], duration: 0.5 },
  },
  open: {
    x: 0,
    transition: {
      ease: [0.32, 0.72, 0, 1],
      duration: 0.5,
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  closed: { opacity: 0, y: 20 },
  open: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } },
};

export function MobileMenu({ isOpen, onClose, nav, agent, ui, onBookingClick }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            className="absolute inset-0 bg-ink/60"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            className="relative flex h-[100svh] w-full max-w-sm flex-col bg-ink px-6 py-6 shadow-2xl sm:px-10"
            variants={panelVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-foam">
                <Home className="size-5 shrink-0" strokeWidth={1.5} />
                <span className="text-[11px] font-normal tracking-[0.28em] uppercase">
                  {agent.firstName}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-mist transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Закрыть меню"
              >
                <X className="size-6" strokeWidth={1.5} />
              </button>
            </div>

            <div className="mt-10 flex-1">
              <motion.p
                variants={itemVariants}
                className="mb-8 text-[10px] font-normal tracking-[0.3em] text-mist/60 uppercase"
              >
                Разделы прогулки
              </motion.p>

              <ul className="flex flex-col gap-8">
                {nav.map((item, index) => (
                  <motion.li key={item.id} variants={itemVariants}>
                    <a href={item.href} onClick={onClose} className="group flex items-center gap-6">
                      <span className="h-px w-6 bg-white/20 transition-colors group-hover:bg-champagne" />
                      <span className="text-[10px] font-normal tracking-[0.2em] text-lagoon">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-display text-[1.4rem] tracking-widest text-champagne uppercase transition-colors group-hover:text-foam">
                        {item.label}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              variants={itemVariants}
              className="mt-auto flex flex-col gap-8 border-t border-white/10 pt-8 pb-4"
            >
              {/* <div className="flex flex-col gap-2 font-light tracking-wider">
                <a
                  href={phoneHref(agent)}
                  className="text-[16px] text-mist hover:text-champagne transition-colors"
                >
                  [{agent.phone}]
                </a>
                <a
                  href={`mailto:${agent.email}`}
                  className="text-[14px] text-mist/60 hover:text-champagne transition-colors"
                >
                  [{agent.email}]
                </a>
              </div> */}
              {/* --- ОБЫЧНАЯ КНОПКА, ВЫЗЫВАЮЩАЯ КОЛБЭК --- */}

              <Button
                type="button"
                variant="outline"
                onClick={onBookingClick}
                className="h-14 w-full rounded-full border border-champagne/50 bg-transparent text-[10px] tracking-[0.2em] text-champagne uppercase hover:bg-champagne hover:text-ink"
              >
                {ui.bookingLabel}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
