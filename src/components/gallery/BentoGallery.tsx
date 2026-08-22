import { Button } from '@/components/ui/button';
import { getGridItemClass } from '@/lib/grid-patterns';
import type { GridPattern, RoomPhoto } from '@/lib/mockDb';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface BentoGalleryProps {
  photos: readonly RoomPhoto[];
  pattern: GridPattern; // Получаем паттерн из родителя
  className?: string;
}

export function BentoGallery({ photos, pattern, className }: BentoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<RoomPhoto | null>(null);

  // Защита: блокируем скролл фона при открытой галерее и слушаем Escape
  useEffect(() => {
    if (!selectedPhoto) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPhoto]);

  if (!photos?.length) return null;

  return (
    // LayoutGroup позволяет Framer Motion связывать элементы между разными частями DOM
    <LayoutGroup>
      <div
        className={cn(
          // Сетка: 2 колонки на мобильных, 4 на десктопе.
          // auto-rows фиксирует высоту базовой ячейки для предсказуемости.
          'group grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[240px] gap-3 md:gap-4',
          className,
        )}
      >
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            layoutId={`container-${photo.id}`} // Связь контейнера для Lightbox
            onClick={() => setSelectedPhoto(photo)}
            className={cn(
              // Скругления 24 (из стиль-гайда)
              'relative cursor-pointer overflow-hidden rounded-[24px] bg-white/5',
              'transition-all duration-500 ease-out',
              // Эффект Spotlight (чистый CSS, 0 ререндеров)
              'group-hover:opacity-40 hover:!opacity-100 hover:shadow-2xl hover:shadow-black/50',
              // Вызываем нашу функцию-стратегию из Шага 2
              getGridItemClass(pattern, index),
            )}
          >
            <motion.img
              layoutId={`image-${photo.id}`} // Связь самой картинки
              src={photo.url}
              alt={photo.alt}
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </motion.div>
        ))}
      </div>

      {/* LIGHTBOX: Полноэкранный режим */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-2xl md:p-12"
            onClick={() => setSelectedPhoto(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-6 top-6 z-[110] h-12 w-12 rounded-full bg-white/10 text-mist hover:bg-white/25 hover:text-white"
              onClick={e => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
              aria-label="Закрыть фото"
            >
              <X className="h-6 w-6" />
            </Button>

            <motion.div
              layoutId={`container-${selectedPhoto.id}`}
              className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center overflow-hidden rounded-[14px] bg-transparent"
              onClick={e => e.stopPropagation()}
            >
              <motion.img
                layoutId={`image-${selectedPhoto.id}`}
                src={selectedPhoto.url}
                alt={selectedPhoto.alt}
                className="max-h-[85vh] w-auto object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
