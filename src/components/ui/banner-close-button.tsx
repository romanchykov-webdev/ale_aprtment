import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

/**
 * Крестик на матовой плашке.
 *
 * Чисто презентационный компонент: контекста не читает, о FrameObserver не
 * знает. Решение «показывать ли крестик вообще» принимает баннер — он же
 * единственный знает, лежит ли он в закрываемом слое.
 */

interface BannerCloseButtonProps {
    onClose: () => void;
    /** Крестик без подписи — скринридеру нужен текст. */
    label?: string;
    className?: string;
}

export function BannerCloseButton({
    onClose,
    label = 'Закрыть панель',
    className,
}: BannerCloseButtonProps) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={onClose}
            className={cn(
                // size="icon" даёт 32px — мало для пальца. Поднимаем до 40px:
                // это нижняя граница тап-таргета по WCAG 2.5.8.
                'absolute top-3 right-3 z-10 size-10 rounded-full',
                // На стекле нужен приглушённый контур, а не залитая кнопка:
                // крестик не должен спорить с золотым заголовком.
                'text-foam/55 hover:bg-white/10 hover:text-champagne',
                'focus-visible:ring-champagne/40',
                className
            )}
        >
            <X className="size-4" aria-hidden="true" />
        </Button>
    );
}
