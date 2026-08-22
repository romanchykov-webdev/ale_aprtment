import { ViewingRequestDialog } from '@/components/forms/ViewingRequestDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BannerCloseButton } from '@/components/ui/banner-close-button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBannerDismiss } from '@/lib/banner-dismiss';
import { agentFullName, agentInitials, type Agent, type UiCopy } from '@/lib/mockDb';
import { cn } from '@/lib/utils';

/**
 * Карточка агента. Чисто презентационный компонент: не знает ни про скролл, ни
 * про кадры, ни про то, где на экране окажется. Когда показаться — решает
 * FrameObserver, где встать — решает страница через className.
 */

interface AgentBannerProps {
  agent: Agent;
  ui: UiCopy;
  className?: string;
}

export function AgentBanner({ agent, ui, className }: AgentBannerProps) {
  const fullName = agentFullName(agent);
  // null означает «этот баннер не в закрываемом слое» — так он рендерится в
  // StaticGallery. Крестика там быть не должно: закрывать нечего.
  const dismiss = useBannerDismiss();

  return (
    <Card
      className={cn(
        // Матовое стекло рабочей плотности. Панель обязана оставаться видимо
        // прозрачной — сквозь неё должен угадываться кадр под ней.
        // relative обязателен: иначе крестик позиционируется от слоя
        // FrameObserver, а не от карточки, и уезжает в угол экрана.
        'relative w-[min(24rem,84vw)] gap-0 rounded-glass border-white/18 bg-white/8 py-8',
        'shadow-[0_32px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150',
        className,
      )}
    >
      {dismiss && (
        <BannerCloseButton onClose={dismiss.close} label={`Закрыть карточку: ${fullName}`} />
      )}

      <CardContent className="flex flex-col items-center gap-5 px-8">
        <Avatar className="size-[9.5rem] border-2 border-white/75 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          {/* Лицо на фото выше центра, поэтому кадрируем ближе к верху. */}
          <AvatarImage src={agent.avatarUrl} alt={fullName} className="object-[center_22%]" />
          <AvatarFallback className="bg-white/12 font-display text-5xl font-light text-foam/90">
            {agentInitials(agent)}
          </AvatarFallback>
        </Avatar>

        <hgroup className="flex flex-col items-center gap-1 text-center">
          {/* Фирменный двухцветный заголовок: имя белым, фамилия золотом. */}
          <h2 className="text-[clamp(1.5rem,3.4vw,2.125rem)] leading-none font-light tracking-[0.16em] text-foam uppercase">
            {agent.firstName}
          </h2>
          <p className="text-[clamp(1.5rem,3.4vw,2.125rem)] leading-none font-light tracking-[0.16em] text-champagne uppercase">
            {agent.lastName}
          </p>
        </hgroup>

        <Separator className="bg-white/18" />

        <p className="text-[10px] font-normal tracking-[0.3em] text-lagoon uppercase">
          {agent.role}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* <Button
            asChild
            variant="outline"
            className="h-auto rounded-full border-white/40 bg-transparent px-7.5 py-3.75 text-[11px] font-normal tracking-[0.22em] text-foam uppercase hover:border-champagne hover:bg-transparent hover:text-champagne active:bg-champagne active:text-ink"
          >
            <a href={phoneHref(agent)}>{ui.callLabel}</a>
          </Button> */}

          <ViewingRequestDialog ui={ui} />
        </div>
      </CardContent>
    </Card>
  );
}
