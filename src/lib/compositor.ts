import type { FrameDefinition } from '../frames/types';
import type { SlotAdjust } from '../frames/types';

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

type ImageSource = HTMLImageElement | HTMLCanvasElement;

function drawImage(
  ctx: CanvasRenderingContext2D,
  img: ImageSource,
  sx: number, sy: number, sw: number, sh: number,
  adj: SlotAdjust
) {
  const iw = img instanceof HTMLCanvasElement ? img.width : img.naturalWidth;
  const ih = img instanceof HTMLCanvasElement ? img.height : img.naturalHeight;
  const isSwapped = adj.rotation === 90 || adj.rotation === 270;
  const fitW = isSwapped ? sh : sw;
  const fitH = isSwapped ? sw : sh;

  const baseScale = Math.max(fitW / iw, fitH / ih);
  const srcW = fitW / baseScale / adj.zoom;
  const srcH = fitH / baseScale / adj.zoom;

  const centerX = (iw - srcW) / 2;
  const centerY = (ih - srcH) / 2;
  const srcX = Math.max(0, Math.min(iw - srcW, centerX - adj.panX * srcW));
  const srcY = Math.max(0, Math.min(ih - srcH, centerY - adj.panY * srcH));

  ctx.save();
  ctx.translate(sx + sw / 2, sy + sh / 2);
  if (adj.flipH) ctx.scale(-1, 1);
  ctx.rotate((adj.rotation * Math.PI) / 180);
  ctx.drawImage(img, srcX, srcY, srcW, srcH, -fitW / 2, -fitH / 2, fitW, fitH);
  ctx.restore();
}

const DEFAULT_ADJ: SlotAdjust = { panX: 0, panY: 0, zoom: 1, flipH: false, rotation: 0 };

export function composite(
  canvas: HTMLCanvasElement,
  frame: FrameDefinition,
  images: (ImageSource | null)[],
  longestSidePx: number,
  adjusts?: (SlotAdjust | null)[]
): void {
  const { aspectRatio } = frame;
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
    const adj = adjusts?.[i] ?? DEFAULT_ADJ;

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
      drawImage(ctx, img, sx, sy, sw, sh, adj);
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
