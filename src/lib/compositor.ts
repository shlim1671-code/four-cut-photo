import type { FrameDefinition } from '../frames/types';

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function composite(
  canvas: HTMLCanvasElement,
  frame: FrameDefinition,
  images: (HTMLImageElement | null)[],
  longestSidePx: number
): void {
  const { aspectRatio } = frame; // width / height
  const canvasW = aspectRatio >= 1
    ? longestSidePx
    : Math.round(longestSidePx * aspectRatio);
  const canvasH = aspectRatio >= 1
    ? Math.round(longestSidePx / aspectRatio)
    : longestSidePx;

  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = frame.background;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const slotRadius = frame.borderRadius
    ? frame.borderRadius * Math.min(canvasW, canvasH)
    : 0;

  frame.slots.forEach((slot, i) => {
    const sx = slot.x * canvasW;
    const sy = slot.y * canvasH;
    const sw = slot.w * canvasW;
    const sh = slot.h * canvasH;
    const img = images[i] ?? null;

    ctx.save();
    if (slotRadius > 0) {
      drawRoundRect(ctx, sx, sy, sw, sh, slotRadius);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(sx, sy, sw, sh);
      ctx.clip();
    }

    if (img) {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(sw / iw, sh / ih);
      const srcW = sw / scale;
      const srcH = sh / scale;
      const srcX = (iw - srcW) / 2;
      const srcY = (ih - srcH) / 2;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, sx, sy, sw, sh);
    } else {
      ctx.fillStyle = '#D4D4D4';
      ctx.fillRect(sx, sy, sw, sh);
    }

    ctx.restore();
  });

  for (const dec of frame.decorations ?? []) {
    if (dec.type !== 'text') continue;
    const fontSize = (dec.fontSize ?? 0.05) * canvasW;
    ctx.font = `${Math.round(fontSize)}px ${dec.font ?? 'sans-serif'}`;
    ctx.fillStyle = dec.color ?? '#1A1A1A';
    ctx.textAlign = dec.align ?? 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dec.content, dec.x * canvasW, dec.y * canvasH);
  }
}
