import { ContactForm } from '@/components/forms/ContactForm';
import type { Agent, Property } from '@/lib/mockDb';
import { cn } from '@/lib/utils';
import { Home, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  agent: Agent;
  property: Property;
  className?: string;
}

export function Footer({ agent, property, className }: FooterProps) {
  return (
    <footer
      className={cn(
        // Контейнер футера: тёмный фон, относительное позиционирование для водяного знака
        'relative flex w-full flex-col overflow-hidden bg-ink px-[clamp(1.5rem,6vw,6rem)] pt-24 pb-12',
        className,
      )}
    >
      {/* Водяной знак на фоне (z-0) */}
      {/* <div
                className="pointer-events-none absolute -bottom-10 right-0 z-0 select-none text-[20vw] font-bold leading-none tracking-tighter text-white/[0.02]"
                aria-hidden="true"
            >
                contact
            </div> */}

      {/* Основной контент (z-10, чтобы быть поверх водяного знака) */}
      <div className="relative z-10 flex flex-col justify-between gap-16 lg:flex-row lg:gap-24">
        {/* Левая колонка: Информация */}
        <div className="flex max-w-lg flex-col pt-4">
          <p className="mb-6 text-[10px] font-normal tracking-[0.3em] text-lagoon uppercase">
            Связаться
          </p>
          <h2 className="mb-6 font-display text-[clamp(2.5rem,5vw,4rem)] leading-none font-light tracking-[0.1em] uppercase">
            <span className="text-foam">Посмотреть</span>{' '}
            <span className="text-champagne">лично</span>
          </h2>
          <p className="mb-12 text-[15px] leading-[1.65] font-light text-mist">
            Отвечаю в течение дня. Организую просмотр на месте или видеозвонком, если вы не в
            городе.
          </p>

          <address className="mb-12 flex flex-col gap-6 not-italic">
            <a
              href={`tel:${agent.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-4 text-mist transition-colors hover:text-champagne"
            >
              <Phone className="h-5 w-5 text-lagoon" strokeWidth={1.5} />
              <span className="text-[17px] tracking-wider">[{agent.phone}]</span>
            </a>
            <a
              href={`mailto:${agent.email}`}
              className="flex items-center gap-4 text-mist transition-colors hover:text-champagne"
            >
              <Mail className="h-5 w-5 text-lagoon" strokeWidth={1.5} />
              <span className="text-[17px] tracking-wider">[{agent.email}]</span>
            </a>
            <div className="flex items-center gap-4 text-mist">
              <MapPin className="h-5 w-5 text-lagoon" strokeWidth={1.5} />
              <span className="text-[17px] tracking-wider">[{property.address}]</span>
            </div>
          </address>

          {/* Соцсети */}
          {/* <div className="flex gap-4">
                        {agent.socials?.map(social => {
                            const Icon =
                                social.platform === 'instagram'
                                    ? Instagram
                                    : social.platform === 'facebook'
                                      ? Facebook
                                      : Send;
                            return (
                                <a
                                    key={social.id}
                                    href={social.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-mist transition-all hover:border-champagne hover:text-champagne"
                                >
                                    <Icon
                                        className="h-4 w-4"
                                        strokeWidth={1.5}
                                    />
                                    <span className="sr-only">
                                        {social.platform}
                                    </span>
                                </a>
                            );
                        })}
                    </div> */}
        </div>

        {/* Правая колонка: Форма */}
        <div className="w-full lg:max-w-md xl:max-w-lg">
          <ContactForm />
        </div>
      </div>

      {/* Нижняя полоса с копирайтом */}
      <div className="relative z-10 mt-32 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row">
        <div className="flex items-center gap-3">
          <Home className="h-4 w-4 text-white" strokeWidth={1.5} />
          <span className="text-[11px] font-normal tracking-[0.2em] text-white uppercase">
            {agent.firstName} <span className="text-champagne">Imobilare</span>
          </span>
        </div>
        <p className="text-[11px] `tracking-[0.1em]` text-white/40">
          © {new Date().getFullYear()} - Квартира в морском стиле
        </p>
      </div>
    </footer>
  );
}
