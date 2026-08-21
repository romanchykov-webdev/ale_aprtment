import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Room } from '@/lib/mockDb';
import { cn } from '@/lib/utils';

interface BottomBannerHorizontalProps {
    room: Room;
    className?: string;
}

export function BottomBannerHorizontal({
    room,
    className,
}: BottomBannerHorizontalProps) {
    return (
        <Card
            className={cn(
                // Расширяем контейнер: вместо 28rem берем шире (до 64rem), чтобы вместить горизонтальный контент
                'w-[min(64rem,92vw)] gap-0 rounded-glass border-white/18 bg-white/8',
                'shadow-[0_32px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150',
                className
            )}
        >
            {/* На мобильных (до md) колонкой, на широких экранах - в строку */}
            <CardContent className="flex flex-col gap-8 p-6 md:flex-row md:p-8">
                {/* Левая часть: Текст и бейджи (занимает доступное пространство flex-1) */}
                <div className="flex flex-1 flex-col justify-center gap-4">
                    <p className="text-[10px] font-normal tracking-[0.3em] text-champagne uppercase">
                        {room.overline}
                    </p>

                    <p className="text-[15px] leading-[1.65] font-light text-mist max-w-2xl">
                        {room.description}
                    </p>

                    {room.features && room.features.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-2">
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
                </div>

                {/* Разделитель (вертикальный на десктопе, горизонтальный на мобилках) */}
                {room.stats && room.stats.length > 0 && (
                    <>
                        <Separator
                            className="hidden h-auto self-stretch bg-white/18 md:block"
                            orientation="vertical"
                        />
                        <Separator
                            className="bg-white/18 md:hidden"
                            orientation="horizontal"
                        />

                        {/* Правая часть: Статистика */}
                        <div className="flex items-center">
                            <dl className="flex flex-wrap gap-x-10 gap-y-6 md:flex-nowrap">
                                {room.stats.map(stat => (
                                    <div
                                        key={stat.id}
                                        className="flex flex-col gap-1.5"
                                    >
                                        <dt className="text-[9px] font-normal tracking-[0.22em] text-lagoon uppercase">
                                            {stat.label}
                                        </dt>
                                        <dd className="whitespace-nowrap font-display text-[2rem] leading-none font-light text-champagne">
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
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
