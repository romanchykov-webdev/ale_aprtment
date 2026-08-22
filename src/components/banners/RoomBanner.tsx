import { Badge } from '@/components/ui/badge';
import { BannerCloseButton } from '@/components/ui/banner-close-button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBannerDismiss } from '@/lib/banner-dismiss';
import type { Room } from '@/lib/mockDb';
import { cn } from '@/lib/utils';

/**
 * Панель с описанием зоны квартиры. Как и AgentBanner — ничего не знает о
 * скролле и о своём месте на экране.
 *
 * Про закрытие она тоже почти ничего не знает: спрашивает у контекста, есть ли
 * куда закрываться, и если нет (StaticGallery, где прогулки не существует) —
 * просто не рисует крестик.
 */

interface RoomBannerProps {
  room: Room;
  className?: string;
}

export function RoomBanner({ room, className }: RoomBannerProps) {
  const dismiss = useBannerDismiss();

  return (
    <Card
      className={cn(
        // relative обязателен: без него крестик считает точкой отсчёта слой
        // FrameObserver и улетает в угол экрана.
        'relative w-[min(28rem,86vw)] gap-0 rounded-glass border-white/18 bg-white/8 py-8',
        'shadow-[0_32px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150',
        className,
      )}
    >
      {dismiss && (
        <BannerCloseButton
          onClose={dismiss.close}
          label={`Закрыть описание: ${room.title.lead} ${room.title.accent}`}
        />
      )}

      <CardContent className="flex flex-col gap-5 px-8">
        <hgroup className="flex flex-col gap-3">
          {/* Бирюза маркирует служебное — надзаголовок и подписи. */}
          <p className="text-[10px] font-normal tracking-[0.3em] text-lagoon uppercase">
            {room.overline}
          </p>
          {/* Золото — содержательное. Разрядка важнее размера.
              Слова разделены настоящим пробелом, а не flex-зазором: иначе
              скринридер прочитал бы заголовок одним слипшимся словом. */}
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-light tracking-[0.14em] uppercase">
            <span className="text-foam">{room.title.lead}</span>{' '}
            <span className="text-champagne">{room.title.accent}</span>
          </h2>
        </hgroup>

        <p className="text-[15px] leading-[1.65] font-light text-mist">{room.description}</p>

        {room.stats.length > 0 && (
          <>
            <Separator className="bg-white/18" />
            <dl className="flex flex-wrap gap-x-10 gap-y-4">
              {room.stats.map(stat => (
                <div key={stat.id} className="flex flex-col gap-1">
                  <dt className="text-[9px] font-normal tracking-[0.22em] text-lagoon uppercase">
                    {stat.label}
                  </dt>
                  {/* Cormorant — только для цифр и крупных акцентов. */}
                  <dd className="font-display text-[2rem] leading-none font-light text-champagne">
                    {stat.value}
                    {stat.unit && (
                      <span className="ml-1 font-sans text-[11px] tracking-[0.18em] text-mist">
                        {stat.unit}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {room.features.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {room.features.map(feature => (
              <li key={feature.id}>
                <Badge
                  variant="outline"
                  className="rounded-full border-white/25 bg-transparent px-3 py-1 text-[9px] font-normal tracking-[0.22em] text-foam/85 uppercase"
                >
                  {feature.label}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
