import { TIERS, type Tier } from "../generated/frameManifest";

const [MOBILE_TIER, DESKTOP_TIER] = TIERS;

/** Kept in sync with the inline tier picker in index.html. */
export const MOBILE_MAX_WIDTH = 640;

declare global {
  interface Window {
    __FRAME_TIER__?: number;
  }
}

/**
 * The tier is chosen by a snippet in <head> so the preload link can point at
 * the right file before the bundle parses. Read that decision back rather than
 * making it twice; the fallback only matters if the snippet did not run.
 */
export function resolveTier(): Tier {
  const fromHead = window.__FRAME_TIER__;
  if (fromHead === MOBILE_TIER || fromHead === DESKTOP_TIER) return fromHead;
  return window.innerWidth <= MOBILE_MAX_WIDTH ? MOBILE_TIER : DESKTOP_TIER;
}
