import { AgentBanner } from '@/components/banners/AgentBanner';
import type { Agent, Room, UiCopy } from '@/lib/mockDb';

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

export function StaticGallery({ agent, ui }: StaticGalleryProps) {
  return (
    <div className="flex flex-col">
      <section id="tour" className="flex  items-center  relative ">
        {/*  */}
        <div className="absolute w-full h-full  flex items-center justify-center ">
          <div className=" scale-30  ">
            <AgentBanner agent={agent} ui={ui} />
          </div>
        </div>
        <img
          className="block w-full h-auto object-cover object-center"
          src="/01out/1.jpg"
          alt="outdoor view of the property"
        />
      </section>
    </div>
  );
}
