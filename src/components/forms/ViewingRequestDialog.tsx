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
 * Карточка агента остаётся презентационной: состояние окна живёт внутри Radix,
 * наружу не торчит и баннеру не принадлежит. Содержимое окна — та же
 * ContactForm, что и в футере, только без своей стеклянной оболочки: рамку и
 * заголовок здесь даёт само окно.
 *
 * Окно уходит порталом в body, поэтому его не задевают ни visibility, ни
 * pointer-events слоя прогулки, а Radix на время показа запирает прокрутку —
 * кадр под окном стоит на месте, пока человек заполняет форму.
 *
 * Отправки пока нет: форма гасит submit и молчит. Телеграм подключим отдельно.
 */

interface ViewingRequestDialogProps {
  ui: UiCopy;
  /** Стили кнопки-триггера задаёт тот, кто её ставит. */
  className?: string;
}

export function ViewingRequestDialog({ ui, className }: ViewingRequestDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Настоящая кнопка, а не <p> под asChild: раньше сюда нельзя
                    было ни попасть табом, ни нажать с клавиатуры. */}
        <Button
          type="button"
          variant="ghost"
          className={cn(
            // Контурная пилюля из брендбука: заливка появляется
            // только в нажатии, в покое — тонкий контур.
            'h-auto rounded-full border-2 border-white/40 bg-transparent px-7.5 py-3.75',
            'text-[11px] font-normal tracking-[0.22em] text-champagne/70 uppercase',
            'hover:border-champagne hover:bg-transparent hover:text-champagne',
            'active:bg-champagne active:text-ink',
            className,
          )}
        >
          {ui.bookingLabel}
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        // Затемнение под окном: кадр обязан угадываться сквозь него,
        // иначе теряется вся идея прогулки за стеклом.
        overlayClassName="bg-ink/60 supports-backdrop-filter:backdrop-blur-sm"
        className={cn(
          // Тёмное стекло для полноэкранных слоёв поверх фото:
          // rgba(10,10,11,0.72) + blur(28px) saturate(130%).
          'w-[min(30rem,92vw)] gap-0 rounded-glass p-8 sm:max-w-none md:p-10',
          // На низком экране окно обязано скроллиться внутри себя,
          // иначе заголовок уезжает за верхний край вьюпорта.
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
          {/* Фирменный двухцветный заголовок: разрядка важнее размера. */}
          <DialogTitle className="text-[clamp(1.5rem,3.4vw,2rem)] leading-tight font-light tracking-[0.14em] uppercase">
            {/* Перенос задаём сами: иначе строка ломается посреди
                            фразы, а не по границе белого и золотого. */}
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
