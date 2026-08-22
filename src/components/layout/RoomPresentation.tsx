import { BentoGallery } from '@/components/gallery/BentoGallery';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Room } from '@/lib/mockDb';
import { cn } from '@/lib/utils';

interface RoomPresentationProps {
  room: Room;
  className?: string;
}

export function RoomPresentation({ room, className }: RoomPresentationProps) {
  // Защита: если конфига нет (например, старые данные), задаем дефолты
  const layoutConfig = room.layoutConfig || {
    align: 'left',
    surface: 'base',
    gridPattern: 'hero-left',
  };

  // СТРАТЕГИЯ В: Цветовые акценты из стиль-гайда
  // base = #0A0A0B (в Tailwind конфиге это bg-ink)
  // elevated = #141416 (указываем явно, чтобы не ломать конфиг)
  const surfaceClass = layoutConfig.surface === 'elevated' ? 'bg-[#141416]' : 'bg-ink';

  // СТРАТЕГИЯ А: Zig-Zag (Чередование колонок)
  // На десктопе (lg) меняем направление flex-контейнера, если align === 'right'
  const alignmentClass = layoutConfig.align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row';

  return (
    <section
      className={cn(
        'w-full px-[clamp(1.5rem,6vw,6rem)] py-24 transition-colors duration-500',
        surfaceClass,
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-[1400px] flex-col gap-16 lg:items-start lg:gap-24',
          alignmentClass,
        )}
      >
        {/* ЛЕВАЯ КОЛОНКА: Контент */}
        <div className="flex w-full flex-col lg:max-w-[420px] xl:max-w-[480px]">
          <hgroup className="mb-10 flex flex-col items-start gap-4">
            <p className="text-[10px] font-normal tracking-[0.3em] text-lagoon uppercase">
              {room.overline}
            </p>
            <h2 className="flex flex-col text-[clamp(2.5rem,4vw,3.5rem)] leading-[1.1] font-light tracking-[0.1em] uppercase">
              <span className="text-foam">{room.title.lead}</span>
              <span className="text-champagne">{room.title.accent}</span>
            </h2>
            <div className="mt-2 h-[2px] w-12 bg-champagne/60" aria-hidden="true" />
          </hgroup>

          <p className="mb-12 text-[15px] leading-[1.7] font-light text-mist">{room.description}</p>

          <Separator className="mb-8 bg-white/10" />

          {/* СТАТИСТИКА */}
          {room.stats && room.stats.length > 0 && (
            <dl className="mb-12 flex flex-wrap gap-x-16 gap-y-8">
              {room.stats.map(stat => (
                <div key={stat.id} className="flex flex-col gap-3">
                  <dt className="text-[9px] font-normal tracking-[0.22em] text-lagoon uppercase">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-[2rem] leading-none font-light text-champagne">
                    {stat.value}
                    {stat.unit && (
                      <span className="ml-1.5 font-sans text-[11px] tracking-[0.18em] text-mist">
                        {stat.unit}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {/* БЕЙДЖИ ОСОБЕННОСТЕЙ */}
          {room.features && room.features.length > 0 && (
            <ul className="mb-14 flex flex-wrap gap-3">
              {room.features.map(feature => (
                <li key={feature.id}>
                  <Badge
                    variant="outline"
                    className="rounded-[14px] border-white/20 bg-transparent px-4 py-1.5 text-[9px] font-normal tracking-[0.22em] text-mist transition-colors hover:border-white/40 hover:text-white uppercase"
                  >
                    {feature.label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          {/* КНОПКА (Оставить заявку / Смотреть фото) */}
          {/* <Button
            variant="outline"
            className="group w-fit rounded-[24px] border-white/20 bg-transparent px-8 py-6 text-[10px] font-normal tracking-[0.22em] text-foam transition-colors hover:border-champagne hover:bg-transparent hover:text-champagne uppercase"
          >
            Смотреть все фото
            <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button> */}
        </div>

        {/* ПРАВАЯ КОЛОНКА: Сетка фотографий */}
        <div className="w-full flex-1">
          {room.photos && room.photos.length > 0 && (
            <BentoGallery photos={room.photos} pattern={layoutConfig.gridPattern} />
          )}
        </div>
      </div>
    </section>
  );
}
