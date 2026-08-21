import { FRAME_COUNT, type Tier } from "../generated/frameManifest";

const MAX_CONCURRENT_LOADS = 6;
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [300, 900];

/**
 * Decoded frames are held as ImageBitmaps, which cost width * height * 4 bytes
 * each — far more than the compressed WebP on the wire. Cap the resident set by
 * memory rather than by count, so the 720px tier is allowed to keep as many
 * frames as the 1280px one keeps fewer.
 */
const MEMORY_BUDGET_BYTES = 200 * 1024 * 1024;
const MIN_RESIDENT = 40;
const MAX_RESIDENT = 200;

type Priority = "high" | "low";

export function frameUrl(index: number, tier: Tier): string {
  return `/frames/${tier}/${String(index).padStart(4, "0")}.webp`;
}

export class FrameLoader {
  private cache = new Map<number, ImageBitmap>();
  private pending = new Set<number>();
  private failed = new Set<number>();
  private highQueue: number[] = [];
  private lowQueue: number[] = [];
  private activeLoads = 0;
  private currentIndex = 0;
  private pinned = new Set<number>();
  private maxResident = MAX_RESIDENT;
  private onFrameReady: ((index: number) => void) | null = null;
  private disposed = false;
  private tier: Tier;

  constructor(tier: Tier) {
    this.tier = tier;
  }

  setOnFrameReady(cb: ((index: number) => void) | null) {
    this.onFrameReady = cb;
  }

  getFrame(index: number): ImageBitmap | undefined {
    return this.cache.get(index);
  }

  /** Frames kept out of eviction — whatever is currently on screen. */
  pin(indices: number[]) {
    this.pinned = new Set(indices);
  }

  setCurrentIndex(index: number) {
    this.currentIndex = index;
  }

  requestFrames(from: number, to: number, priority: Priority) {
    const start = Math.max(0, from);
    const end = Math.min(FRAME_COUNT - 1, to);
    for (let index = start; index <= end; index++) {
      if (this.cache.has(index) || this.pending.has(index) || this.failed.has(index)) continue;
      this.pending.add(index);
      if (priority === "high") this.highQueue.push(index);
      else this.lowQueue.push(index);
    }
    this.pump();
  }

  dispose() {
    this.disposed = true;
    this.onFrameReady = null;
    this.highQueue.length = 0;
    this.lowQueue.length = 0;
    this.pending.clear();
    for (const bitmap of this.cache.values()) bitmap.close();
    this.cache.clear();
  }

  private pump() {
    while (!this.disposed && this.activeLoads < MAX_CONCURRENT_LOADS) {
      const index = this.highQueue.shift() ?? this.lowQueue.shift();
      if (index === undefined) return;
      this.activeLoads++;
      void this.load(index).finally(() => {
        this.activeLoads--;
        this.pump();
      });
    }
  }

  private async load(index: number) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (this.disposed) return;
      try {
        const res = await fetch(frameUrl(index, this.tier));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);

        if (this.disposed) {
          bitmap.close();
          return;
        }

        this.pending.delete(index);
        this.cache.set(index, bitmap);
        this.calibrateBudget(bitmap);
        this.evictIfNeeded();
        this.onFrameReady?.(index);
        return;
      } catch {
        const delay = RETRY_DELAYS_MS[attempt];
        if (delay === undefined) break;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Out of attempts: remember the failure so the frame is not retried on
    // every subsequent scroll tick.
    this.pending.delete(index);
    this.failed.add(index);
  }

  /** The decoded size is only known once a frame has actually been decoded. */
  private calibrateBudget(bitmap: ImageBitmap) {
    const bytesPerFrame = bitmap.width * bitmap.height * 4;
    if (bytesPerFrame <= 0) return;
    const affordable = Math.floor(MEMORY_BUDGET_BYTES / bytesPerFrame);
    this.maxResident = Math.min(MAX_RESIDENT, Math.max(MIN_RESIDENT, affordable));
  }

  private evictIfNeeded() {
    if (this.cache.size <= this.maxResident) return;

    const evictable = [...this.cache.keys()]
      .filter((index) => !this.pinned.has(index))
      .sort((a, b) => Math.abs(b - this.currentIndex) - Math.abs(a - this.currentIndex));

    let excess = this.cache.size - this.maxResident;
    for (const index of evictable) {
      if (excess <= 0) break;
      this.cache.get(index)?.close();
      this.cache.delete(index);
      excess--;
    }
  }
}
