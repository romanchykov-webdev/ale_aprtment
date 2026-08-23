import { ContactForm } from '@/components/forms/ContactForm';
import { BannerCloseButton } from '@/components/ui/banner-close-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { UiCopy } from '@/lib/mockDb';
import { cn } from '@/lib/utils';

/**
 * Кнопка «Записаться на просмотр» вместе с окном, которое она открывает.
 *
 * Окно уходит порталом в body, поэтому его не задевают ни visibility, ни
 * pointer-events слоя прогулки, а Radix на время показа запирает прокрутку.
 */

interface ViewingRequestDialogProps {
  ui: UiCopy;
  className?: string;
  // --- НОВЫЕ ПРОПСЫ ДЛЯ УПРАВЛЕНИЯ СНАРУЖИ ---
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function ViewingRequestDialog({
  ui,
  className,
  open,
  onOpenChange,
  hideTrigger = false,
}: ViewingRequestDialogProps) {
  return (
    // Передаем управление стейтом в Radix
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Рендерим кнопку-триггер ТОЛЬКО если не попросили её скрыть */}
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'h-auto rounded-full border-2 border-white/40 bg-black/20',
              // 'bg-transparent',
              ' px-7.5 py-3.75',
              'text-[11px] font-normal tracking-[0.22em] text-champagne/70 uppercase',
              'hover:border-champagne hover:bg-transparent hover:text-champagne',
              'active:bg-champagne active:text-ink',
              className,
            )}
          >
            {ui.bookingLabel}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-ink/60 supports-backdrop-filter:backdrop-blur-sm"
        className={cn(
          'w-[min(30rem,92vw)] gap-0 rounded-glass p-8 sm:max-w-none md:p-10',
          'max-h-[calc(100svh-2rem)] overflow-y-auto',
          'border border-white/18 bg-ink/72 text-foam ring-0',
          'shadow-[0_32px_80px_rgba(0,0,0,0.45)]',
          'backdrop-blur-[28px] backdrop-saturate-[130%]',
        )}
      >
        <DialogClose asChild>
          <BannerCloseButton label="Закрыть окно записи" />
        </DialogClose>

        <DialogHeader className="mb-8 gap-3">
          <DialogTitle className="text-[clamp(1.5rem,3.4vw,2rem)] leading-tight font-light tracking-[0.14em] uppercase">
            <span className="block text-foam">{ui.bookingTitle.lead}</span>
            <span className="block text-champagne">{ui.bookingTitle.accent}</span>
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-[1.65] font-light text-mist">
            {ui.bookingNote}
          </DialogDescription>
        </DialogHeader>

        <ContactForm bare />
      </DialogContent>
    </Dialog>
  );
}
