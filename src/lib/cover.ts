/**
 * Draws an image scaled like `object-fit: cover` — filling the canvas and
 * cropping the overflow, centred.
 *
 * Deliberately does not clear the canvas first: a cover fit always paints every
 * pixel, and the crossfade relies on drawing a second layer over the first.
 */
export function drawCoverFrame(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  cssW: number,
  cssH: number,
) {
  const scale = Math.max(cssW / img.width, cssH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (cssW - drawW) / 2;
  const dy = (cssH - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);
}
