import { useCallback, useEffect, useRef } from 'react';
import type { FrameDefinition } from '../../frames/types';
import type { SlotAdjust } from '../../frames/types';
import type { Adjustments, ToneEffects } from '../../lib/imageProcessing';
import {
  NEUTRAL_ADJUSTMENTS,
  NO_TONE,
  isNeutral,
  renderAdjusted,
} from '../../lib/imageProcessing';
import { composite } from '../../lib/compositor';

interface CanvasPreviewProps {
  frame: FrameDefinition;
  images: string[];
  adjusts?: SlotAdjust[];
  adjustments?: Adjustments;
  tone?: ToneEffects;
  selectedSlot?: number | null;
  onSlotClick?: (index: number) => void;
}

const PREVIEW_LONGEST_SIDE = 600;
// 보정은 가벼운 다운스케일 이미지에 적용 (SPEC 6). 원본 해상도 적용은 export 시점.
const PROCESS_MAX_SIDE = 480;
// 무거운 픽셀 연산은 슬라이더 조작이 멈춘 뒤에만 (debounce).
const ADJUST_DEBOUNCE_MS = 120;

type ImageSource = HTMLImageElement | HTMLCanvasElement;

export default function CanvasPreview({
  frame,
  images,
  adjusts,
  adjustments,
  tone,
  selectedSlot,
  onSlotClick,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedRef = useRef<(HTMLImageElement | null)[]>([]);
  const processedRef = useRef<(ImageSource | null)[]>([]);

  // 비동기 콜백·debounce에서 최신 값을 읽기 위한 ref 미러.
  const frameRef = useRef(frame);
  const adjustsRef = useRef(adjusts);
  const selectedRef = useRef<number | null>(selectedSlot ?? null);
  const adjustmentsRef = useRef(adjustments ?? NEUTRAL_ADJUSTMENTS);
  const toneRef = useRef(tone ?? NO_TONE);

  // 이 effect는 매 렌더마다, 다른 effect보다 먼저 실행되어 ref를 최신화한다.
  useEffect(() => {
    frameRef.current = frame;
    adjustsRef.current = adjusts;
    selectedRef.current = selectedSlot ?? null;
    adjustmentsRef.current = adjustments ?? NEUTRAL_ADJUSTMENTS;
    toneRef.current = tone ?? NO_TONE;
  });

  const renderComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    composite(canvas, frameRef.current, processedRef.current, PREVIEW_LONGEST_SIDE, adjustsRef.current);
    drawSelection(canvas, frameRef.current, selectedRef.current ?? null);
  }, []);

  const processOne = useCallback((img: HTMLImageElement): ImageSource => {
    const adj = adjustmentsRef.current;
    const t = toneRef.current;
    return isNeutral(adj, t) ? img : renderAdjusted(img, adj, t, PROCESS_MAX_SIDE);
  }, []);

  const rebuildAll = useCallback(() => {
    processedRef.current = loadedRef.current.map((img) => (img ? processOne(img) : null));
    renderComposite();
  }, [processOne, renderComposite]);

  // 이미지 로드. 프레임이 바뀌어도 칸 수는 동일하므로 재로드하지 않는다.
  useEffect(() => {
    const slotCount = frameRef.current.slots.length;
    loadedRef.current = Array(slotCount).fill(null);
    processedRef.current = Array(slotCount).fill(null);
    renderComposite();

    let cancelled = false;
    images.slice(0, slotCount).forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        loadedRef.current[i] = img;
        processedRef.current[i] = processOne(img);
        renderComposite();
      };
      img.src = src;
    });
    return () => { cancelled = true; };
  }, [images, processOne, renderComposite]);

  // 보정값 변경 → debounce 후 다운스케일 이미지 재처리.
  useEffect(() => {
    const id = setTimeout(rebuildAll, ADJUST_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [adjustments, tone, rebuildAll]);

  // 칸 배치/선택/프레임 변경 → 재처리 없이 합성만 (가벼움).
  useEffect(() => {
    renderComposite();
  }, [adjusts, selectedSlot, frame, renderComposite]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    for (let i = 0; i < frame.slots.length; i++) {
      const s = frame.slots[i];
      if (nx >= s.x && nx <= s.x + s.w && ny >= s.y && ny <= s.y + s.h) {
        onSlotClick(i);
        return;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        cursor: onSlotClick ? 'pointer' : 'default',
      }}
    />
  );
}

function drawSelection(
  canvas: HTMLCanvasElement,
  frame: FrameDefinition,
  selectedSlot: number | null
) {
  if (selectedSlot === null) return;
  const s = frame.slots[selectedSlot];
  if (!s) return;
  const ctx = canvas.getContext('2d')!;
  const sx = s.x * canvas.width;
  const sy = s.y * canvas.height;
  const sw = s.w * canvas.width;
  const sh = s.h * canvas.height;
  const lw = Math.max(2, canvas.width / 120);
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = lw;
  ctx.strokeRect(sx + lw / 2, sy + lw / 2, sw - lw, sh - lw);
}
