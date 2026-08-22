import { AgentBanner } from '@/components/banners/AgentBanner';
import { RoomBanner } from '@/components/banners/RoomBanner';
import { Header } from '@/components/layout/Header';
import { FrameObserver } from '@/components/scroll/FrameObserver';
import { FrameProgressProvider } from '@/components/scroll/FrameProgressProvider';
import { ScrollScrubber } from '@/components/scroll/ScrollScrubber';
import { StaticGallery } from '@/components/StaticGallery';
import { listingPromise } from '@/lib/listingResource';
import { useReducedMotion } from 'motion/react';
import { Suspense, use } from 'react';
import { BottomBannerHorizontal } from './components/banners/BottomBannerHorizontal';
import { Footer } from './components/layout/Footer';
import { RoomPresentation } from './components/layout/RoomPresentation';

/**
 * Сборка страницы.
 *
 * Единственная асинхронная операция вынесена в listingResource и разрешается
 * через use() под Suspense — в разметке остаётся только описание того, что мы
 * рендерим. Как оно вычисляется, JSX не знает.
 *
 * Границы startFrame/endFrame подобраны по dev-счётчику кадров и намеренно
 * заданы числами прямо здесь: когда какой панели появиться — решение
 * режиссёрское.
 *
 * Что где в отснятом материале: 0–36 дом снаружи, 37–73 подъём вдоль фасада и
 * вход внутрь, 74–110 кухня-гостиная, 111–147 выход через прихожую, 148–184
 * спальня. Клипы 2 и 4 — переходы, панелей на них нет: текст поверх
 * движущейся камеры не читается.
 *
 * Композиция чередуется по требованию брендбука: два одинаковых по построению
 * экрана подряд идти не должны.
 */

export default function App() {
  return (
    <Suspense fallback={<ListingFallback />}>
      <Listing />
    </Suspense>
  );
}

function ListingFallback() {
  return <div className="min-h-svh bg-ink" aria-hidden="true" />;
}

function Listing() {
  const { agent, property, rooms, nav, ui } = use(listingPromise);
  const reducedMotion = useReducedMotion();

  const [exterior, living, bedroom] = rooms;

  if (reducedMotion) {
    return (
      <>
        <Header agent={agent} property={property} nav={nav} ui={ui} />
        <main>
          <h1 className="sr-only">{ui.srHeading}</h1>
          <StaticGallery agent={agent} rooms={rooms} ui={ui} />
        </main>
      </>
    );
  }

  return (
    <>
      <Header agent={agent} property={property} nav={nav} ui={ui} />
      <main>
        {/* Канвас не несёт текста ни для скринридеров, ни для поисковиков. */}
        <h1 className="sr-only">{ui.srHeading}</h1>
        <p className="sr-only">{property.description}</p>

        <FrameProgressProvider>
          <ScrollScrubber ariaLabel={ui.tourAriaLabel} scrollHint={ui.scrollHint} anchors={nav}>
            <FrameObserver
              startFrame={-8}
              endFrame={20}
              inEffect="fade"
              outEffect="fade-left"
              inFrames={8}
              outFrames={7}
              className="scrim-left items-center justify-start pl-[clamp(1.5rem,6vw,6rem)]"
            >
              <AgentBanner agent={agent} ui={ui} />
            </FrameObserver>

            {/* fasade */}
            <FrameObserver
              startFrame={24}
              endFrame={50}
              inEffect="fade-right"
              outEffect="fade-right"
              inFrames={7}
              outFrames={7}
              className="scrim-right items-center justify-end pr-[clamp(1.5rem,6vw,6rem)]"
            >
              <RoomBanner room={exterior} />
            </FrameObserver>

            {/* kitchen-living */}
            <FrameObserver
              startFrame={60}
              endFrame={100}
              inEffect="fade-left"
              outEffect="fade-left"
              className="scrim-left items-center justify-start pl-[clamp(1.5rem,6vw,6rem)] "
            >
              <RoomBanner room={living} />
            </FrameObserver>

            {/* bathroom */}
            <FrameObserver
              startFrame={130}
              endFrame={170}
              inEffect="fade-up"
              outEffect="fade-up"
              inFrames={8}
              outFrames={8}
              className="scrim-bottom items-end justify-center pb-[clamp(1.5rem,5vh,4rem)]"
            >
              <BottomBannerHorizontal room={bedroom} />
            </FrameObserver>
          </ScrollScrubber>
        </FrameProgressProvider>
      </main>
      <RoomPresentation room={rooms[0]} /> {/* ФАСАД */}
      <RoomPresentation room={rooms[1]} /> {/* КУХНЯ-ГОСТИНАЯ */}
      <RoomPresentation room={rooms[2]} /> {/* СПАЛЬНЯ С ГАРДЕРОБОМ */}
      <RoomPresentation room={rooms[3]} /> {/* Ванная */}
      <RoomPresentation room={rooms[4]} /> {/* Балкон */}
      {/* footer */}
      <Footer agent={agent} property={property} />
    </>
  );
}
