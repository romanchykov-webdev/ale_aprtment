import { AgentBanner } from '@/components/banners/AgentBanner';
import { RoomBanner } from '@/components/banners/RoomBanner';
import { frameUrl } from '@/lib/frameLoader';
import type { Agent, Room, UiCopy } from '@/lib/mockDb';
import { resolveTier } from '@/lib/tier';

/**
 * Версия для посетителей, попросивших уменьшить количество анимации: та же
 * прогулка стопкой неподвижных кадров.
 *
 * Баннеры здесь те же самые, только без FrameObserver — они «глупые», поэтому
 * переиспользуются как есть. Заодно этот путь даёт странице настоящий текст
 * для скринридеров и поисковиков: у скруббера весь контент лежит на канвасе.
 */

interface StaticGalleryProps {
  agent: Agent;
  rooms: readonly Room[];
  ui: UiCopy;
}

export function StaticGallery({ agent, rooms, ui }: StaticGalleryProps) {
  const tier = resolveTier();

  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center gap-8 px-[clamp(1rem,5vw,3rem)] py-16">
        <AgentBanner agent={agent} ui={ui} />
      </section>

      {rooms.map((room, index) => (
        <section key={room.id} className="flex flex-col">
          <img
            className="block h-auto w-full"
            src={frameUrl(room.stillFrame, tier)}
            alt={room.photoAlt}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
          <div className="flex justify-center px-[clamp(1rem,5vw,3rem)] py-12">
            <RoomBanner room={room} />
          </div>
        </section>
      ))}
    </div>
  );
}
