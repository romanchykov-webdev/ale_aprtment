/**
 * Maps a scroll position onto what should be drawn.
 *
 * The frames of all clips form one flat sequence, but a hard cut between two
 * clips reads as a scene break. To soften it, each junction overlaps: the last
 * TRANSITION frames of the outgoing clip play at the same time as the first
 * TRANSITION frames of the incoming one, blended by alpha. Both clips keep
 * moving through the dissolve, so nothing freezes.
 *
 * Because the overlap consumes frames from both sides, the timeline is shorter
 * than the raw frame count: totalUnits = FRAME_COUNT - TRANSITION * junctions.
 */

export const TRANSITION = 6;

/** What to draw at a given position: layer `a`, optionally `b` blended over it. */
export interface RenderPlan {
  a: number;
  b: number | null;
  mix: number;
}

interface Segment {
  /** Virtual position where this segment starts. */
  start: number;
  /** How many virtual units it spans. */
  length: number;
  /** Frame index that layer `a` takes at the segment's start. */
  frameA: number;
  /** Frame index for layer `b`, or null for a solo segment. */
  frameB: number | null;
}

export interface Timeline {
  totalUnits: number;
  resolve(pos: number): RenderPlan;
  /**
   * Дробный индекс кадра слоя `a`.
   *
   * resolve() округляет: канвасу нужен конкретный кадр, промежуточных не
   * бывает. Анимациям наоборот нужна непрерывность — переход длиной в шесть
   * кадров, построенный на округлённом значении, идёт шестью видимыми
   * ступеньками. Поэтому у оверлеев отдельный вход в те же сегменты.
   */
  resolveFrame(pos: number): number;
}

export function buildTimeline(framesPerClip: readonly number[]): Timeline {
  const segments: Segment[] = [];
  let cursor = 0;
  let clipStart = 0;

  for (let clip = 0; clip < framesPerClip.length; clip++) {
    const count = framesPerClip[clip];
    const isFirst = clip === 0;
    const isLast = clip === framesPerClip.length - 1;

    // Frames consumed by the dissolve on either side of this clip.
    const headOverlap = isFirst ? 0 : TRANSITION;
    const tailOverlap = isLast ? 0 : TRANSITION;

    const soloStart = clipStart + headOverlap;
    const soloLength = count - headOverlap - tailOverlap;

    segments.push({
      start: cursor,
      length: soloLength,
      frameA: soloStart,
      frameB: null,
    });
    cursor += soloLength;

    if (!isLast) {
      // Tail of this clip dissolving into the head of the next one.
      segments.push({
        start: cursor,
        length: TRANSITION,
        frameA: clipStart + count - TRANSITION,
        frameB: clipStart + count,
      });
      cursor += TRANSITION;
    }

    clipStart += count;
  }

  const totalUnits = cursor;

  /** Which segment covers `pos`, and how far into it we are. */
  function locate(pos: number): { segment: Segment; offset: number } {
    const clamped = Math.min(Math.max(pos, 0), totalUnits - 1);

    // Segments are few (2n-1 for n clips), so a linear scan is cheaper than
    // the bookkeeping a binary search would need.
    let segment = segments[segments.length - 1];
    for (const candidate of segments) {
      if (clamped < candidate.start + candidate.length) {
        segment = candidate;
        break;
      }
    }

    return { segment, offset: clamped - segment.start };
  }

  function resolve(pos: number): RenderPlan {
    const { segment, offset } = locate(pos);

    if (segment.frameB === null) {
      return { a: segment.frameA + Math.round(offset), b: null, mix: 0 };
    }

    const step = Math.floor(offset);
    return {
      a: segment.frameA + step,
      b: segment.frameB + step,
      // +1 so the dissolve both starts and ends partially blended rather than
      // snapping from a fully opaque `a` to a fully opaque `b`.
      mix: (offset + 1) / (segment.length + 1),
    };
  }

  function resolveFrame(pos: number): number {
    const { segment, offset } = locate(pos);
    return segment.frameA + offset;
  }

  return { totalUnits, resolve, resolveFrame };
}
