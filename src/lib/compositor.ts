import type { FrameDefinition } from '../frames/types';
import type { SlotAdjust } from '../frames/types';
import { computeSlotCrop } from './slotGeometry';
import { loadImage } from './loadImage';

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

/**
 * 칸 기울임(tilt)을 칸 중심 기준 회전으로 현재 변환에 적용한다.
 * "어디를 잘라올지"(slotGeometry) 계산은 건드리지 않고 "그리는 시점"에만 돈다.
 * 호출부가 save/restore로 감싼다.
 */
export function applySlotTilt(
  ctx: CanvasRenderingContext2D,
  tilt: number | undefined,
  cx: number,
  cy: number
): void {
  if (!tilt) return;
  ctx.translate(cx, cy);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.translate(-cx, -cy);
}

function drawImage(
  ctx: CanvasRenderingContext2D,
  img: ImageSource,
  sx: number, sy: number, sw: number, sh: number,
  adj: SlotAdjust
) {
  const iw = img instanceof HTMLCanvasElement ? img.width : img.naturalWidth;
  const ih = img instanceof HTMLCanvasElement ? img.height : img.naturalHeight;
  const { srcX, srcY, srcW, srcH, fitW, fitH } = computeSlotCrop(iw, ih, sw, sh, adj);

  ctx.save();
  ctx.translate(sx + sw / 2, sy + sh / 2);
  if (adj.flipH) ctx.scale(-1, 1);
  ctx.rotate((adj.rotation * Math.PI) / 180);
  ctx.drawImage(img, srcX, srcY, srcW, srcH, -fitW / 2, -fitH / 2, fitW, fitH);
  ctx.restore();
}

const DEFAULT_ADJ: SlotAdjust = { panX: 0, panY: 0, zoom: 1, flipH: false, rotation: 0 };

/**
 * 프레임 배경 이미지를 미리 로드한다. composite가 동기 함수이므로 로드는
 * 호출부에서 끝내고 결과만 넘긴다 — 미리보기와 export가 같은 경로를 쓴다.
 * 배경은 장식 요소라 실패해도 핵심 기능이 아니므로 null을 돌려주고 조용히
 * 단색 background로 폴백한다(에러를 사용자에게 노출하지 않는다).
 */
export function loadFrameBackground(
  src: string | undefined
): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return loadImage(src).catch(() => null);
}

export function composite(
  canvas: HTMLCanvasElement,
  frame: FrameDefinition,
  images: (ImageSource | null)[],
  longestSidePx: number,
  adjusts?: (SlotAdjust | null)[],
  backgroundImage?: ImageSource | null
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
  // 배경 이미지는 단색 위에 프레임 전체 영역으로 그린다. 로드 실패 시
  // 호출부가 null을 넘기므로 단색 배경이 그대로 남는다.
  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, canvasW, canvasH);
  }

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
    // 클립보다 먼저 적용해야 칸 자체(테두리·클립 영역)가 함께 기울어진다.
    applySlotTilt(ctx, slot.tilt, sx + sw / 2, sy + sh / 2);
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
