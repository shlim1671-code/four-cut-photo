import type { SlotAdjust } from '../frames/types';

export interface SlotCrop {
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
  fitW: number;
  fitH: number;
}

/**
 * 칸 조정값(위치·줌·반전·회전)을 원본 이미지의 잘라낼 영역으로 변환한다.
 * SlotEditor 미리보기와 compositor 최종 합성이 이 함수를 공유해 동일한 좌표를 쓴다.
 *
 * srcX/srcY/srcW/srcH는 slotW:slotH의 "비율"에만 의존하고 절대 크기에는 무관하다.
 * → 미리보기 해상도(480px)와 export 해상도(2400px)가 달라도 결과 구도가 같다.
 */
export function computeSlotCrop(
  iw: number,
  ih: number,
  slotW: number,
  slotH: number,
  adj: SlotAdjust
): SlotCrop {
  const isSwapped = adj.rotation === 90 || adj.rotation === 270;
  const fitW = isSwapped ? slotH : slotW;
  const fitH = isSwapped ? slotW : slotH;

  const baseScale = Math.max(fitW / iw, fitH / ih);
  const srcW = fitW / baseScale / adj.zoom;
  const srcH = fitH / baseScale / adj.zoom;

  const centerX = (iw - srcW) / 2;
  const centerY = (ih - srcH) / 2;
  const srcX = Math.max(0, Math.min(iw - srcW, centerX - adj.panX * srcW));
  const srcY = Math.max(0, Math.min(ih - srcH, centerY - adj.panY * srcH));

  return { srcX, srcY, srcW, srcH, fitW, fitH };
}
