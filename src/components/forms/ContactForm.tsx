import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ContactFormProps {
    className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
    // Базовые стили для инпутов, чтобы не дублировать код.
    // Используем focus-within для изменения цвета рамки при активном вводе.
    const inputBaseClasses = cn(
        'w-full border-0 border-b border-white/20 bg-transparent py-4 text-[11px] font-normal tracking-[0.2em] text-white uppercase outline-none',
        'transition-colors placeholder:text-white/40 focus:border-champagne focus:ring-0'
    );

    return (
        <div
            className={cn(
                'rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-12',
                className
            )}
        >
            <p className="mb-8 text-[10px] font-normal tracking-[0.3em] text-lagoon uppercase">
                Оставить заявку
            </p>

            {/* В будущем здесь будет <form onSubmit={...}> с react-hook-form */}
            <form
                className="flex flex-col gap-2"
                onSubmit={e => e.preventDefault()}
            >
                <input
                    type="text"
                    placeholder="Имя"
                    className={inputBaseClasses}
                    required
                />
                <input
                    type="tel"
                    placeholder="Телефон"
                    className={inputBaseClasses}
                    required
                />
                <input
                    type="email"
                    placeholder="E-mail"
                    className={inputBaseClasses}
                    required
                />
                <textarea
                    placeholder="Сообщение"
                    rows={3}
                    className={cn(inputBaseClasses, 'resize-none')}
                />

                <Button
                    type="submit"
                    variant="outline"
                    className="mt-10 h-14 w-full rounded-full border-champagne bg-transparent text-[10px] tracking-[0.2em] text-champagne hover:bg-champagne hover:text-ink uppercase"
                >
                    Отправить <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
