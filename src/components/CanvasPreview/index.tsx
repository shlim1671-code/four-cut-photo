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
import { applySlotTilt, composite, loadFrameImage } from '../../lib/compositor';
import { waitForStampFont } from '../../lib/dateStamp';
import { loadImage } from '../../lib/loadImage';

interface CanvasPreviewProps {
  frame: FrameDefinition;
  images: string[];
  adjusts?: SlotAdjust[];
  adjustments?: Adjustments;
  tone?: ToneEffects;
  selectedSlot?: number | null;
  onSlotClick?: (index: number) => void;
}

// 미리보기 픽셀 크기 상한. export(2400)와 분리해 미리보기가 과하게 무거워지지 않게 한다.
const PREVIEW_MAX_LONGEST_SIDE = 2400;
// 레이아웃 전(표시 폭 0)일 때 임시 fallback. ResizeObserver가 곧 실제 크기로 재렌더한다.
const PREVIEW_FALLBACK_LONGEST_SIDE = 600;
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
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const foregroundRef = useRef<HTMLImageElement | null>(null);

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

  // 미리보기 longest side를 실제 표시 폭 × DPR 기준으로 산출한다.
  // 작은 canvas를 CSS로 늘려 표시하면(업스케일) 흐려지므로, 픽셀 폭이
  // 표시 폭 × DPR 이상이 되도록 한다. 세로 스트립처럼 길쭉한 프레임도 마찬가지.
  const computeLongestSide = useCallback((canvas: HTMLCanvasElement): number => {
    const cssWidth = canvas.clientWidth;
    if (!cssWidth) return PREVIEW_FALLBACK_LONGEST_SIDE;
    const dpr = window.devicePixelRatio || 1;
    const aspect = frameRef.current.aspectRatio;
    // canvas 픽셀 폭 = longest × min(aspect, 1) 이므로,
    // 픽셀 폭이 표시폭×DPR 이상이 되려면 longest = 표시폭×DPR / min(aspect,1).
    const longest = (cssWidth * dpr) / Math.min(aspect, 1);
    return Math.min(Math.ceil(longest), PREVIEW_MAX_LONGEST_SIDE);
  }, []);

  const renderComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    composite(
      canvas,
      frameRef.current,
      processedRef.current,
      computeLongestSide(canvas),
      adjustsRef.current,
      backgroundRef.current,
      foregroundRef.current
    );
    drawSelection(canvas, frameRef.current, selectedRef.current ?? null);
  }, [computeLongestSide]);

  // 프레임 배경·전경 이미지 로드. 프레임이 바뀌면 즉시 비워 이전 이미지가 남지
  // 않게 하고, 로드가 끝나면 다시 그린다. 실패하면 null로 남아 폴백된다.
  // (아래 렌더 effect들보다 먼저 선언해 같은 커밋에서 ref가 먼저 초기화되게 한다.)
  useEffect(() => {
    backgroundRef.current = null;
    foregroundRef.current = null;
    let cancelled = false;
    loadFrameImage(frame.backgroundImage).then((img) => {
      if (cancelled || !img) return;
      backgroundRef.current = img;
      renderComposite();
    });
    loadFrameImage(frame.foregroundImage).then((img) => {
      if (cancelled || !img) return;
      foregroundRef.current = img;
      renderComposite();
    });
    return () => { cancelled = true; };
  }, [frame.backgroundImage, frame.foregroundImage, renderComposite]);

  // 날짜 스탬프 폰트가 준비되면 다시 그린다. 폰트 로드 전에 그리면 폴백 폰트로
  // 굳어 export 결과와 어긋난다.
  useEffect(() => {
    let cancelled = false;
    waitForStampFont(frame.dateStamp).then(() => {
      if (!cancelled) renderComposite();
    });
    return () => { cancelled = true; };
  }, [frame.dateStamp, renderComposite]);

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
      loadImage(src)
        .then((img) => {
          if (cancelled) return;
          loadedRef.current[i] = img;
          processedRef.current[i] = processOne(img);
          renderComposite();
        })
        // 실패한 칸은 빈 슬롯(회색)으로 두고 나머지 칸 렌더링은 계속한다.
        .catch(() => {});
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

  // 표시 영역 크기가 바뀌면(반응형 레이아웃/회전) 미리보기 해상도를 다시 맞춘다.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => renderComposite());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [renderComposite]);

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
  ctx.save();
  // 기울어진 칸은 선택 테두리도 같이 기울어야 실제 칸 위치와 맞는다.
  applySlotTilt(ctx, s.tilt, sx + sw / 2, sy + sh / 2);
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = lw;
  ctx.strokeRect(sx + lw / 2, sy + lw / 2, sw - lw, sh - lw);
  ctx.restore();
}
