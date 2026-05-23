import { useEffect, useRef, useCallback } from 'react';
import type { SlotAdjust, FrameSlot } from '../../frames/types';

interface SlotEditorProps {
  slotIndex: number;
  image: string;
  adjust: SlotAdjust;
  slot: FrameSlot;
  onChange: (adj: SlotAdjust) => void;
  onClose: () => void;
}

const PREVIEW_H = 400;

function renderPreview(canvas: HTMLCanvasElement, img: HTMLImageElement, adj: SlotAdjust) {
  const sw = canvas.width;
  const sh = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  ctx.clearRect(0, 0, sw, sh);
  ctx.fillStyle = '#D4D4D4';
  ctx.fillRect(0, 0, sw, sh);

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
  ctx.translate(sw / 2, sh / 2);
  if (adj.flipH) ctx.scale(-1, 1);
  ctx.rotate((adj.rotation * Math.PI) / 180);
  ctx.drawImage(img, srcX, srcY, srcW, srcH, -fitW / 2, -fitH / 2, fitW, fitH);
  ctx.restore();
}

export default function SlotEditor({ slotIndex, image, adjust, slot, onChange, onClose }: SlotEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const adjustRef = useRef(adjust);
  const onChangeRef = useRef(onChange);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const touchRef = useRef<{ id: number; x: number; y: number }[]>([]);
  const pinchDistRef = useRef<number | null>(null);

  useEffect(() => { adjustRef.current = adjust; }, [adjust]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const slotAspect = slot.w / slot.h;

  // Load image and set canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.height = PREVIEW_H;
    canvas.width = Math.round(PREVIEW_H * slotAspect);

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      imgRef.current = img;
      renderPreview(canvas, img, adjustRef.current);
    };
    img.src = image;
    return () => { cancelled = true; };
  }, [image, slotAspect]);

  // Re-render when adjust changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (canvas && img) renderPreview(canvas, img, adjust);
  }, [adjust]);

  // Pan delta helper (shared by mouse and touch)
  const applyPanDelta = useCallback((dx: number, dy: number, clientW: number, clientH: number) => {
    const adj = adjustRef.current;
    const θ = (adj.rotation * Math.PI) / 180;
    const cos = Math.cos(θ);
    const sin = Math.sin(θ);
    // Sticky-pan formula: pixel under finger stays fixed
    const dPanX = (cos * dx + sin * dy) / clientW;
    const dPanY = (-sin * dx + cos * dy) / clientH;
    onChangeRef.current({
      ...adj,
      panX: Math.max(-1, Math.min(1, adj.panX + dPanX)),
      panY: Math.max(-1, Math.min(1, adj.panY + dPanY)),
    });
  }, []);

  // Mouse pan
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseRef.current) return;
    const dx = e.clientX - mouseRef.current.x;
    const dy = e.clientY - mouseRef.current.y;
    mouseRef.current = { x: e.clientX, y: e.clientY };
    const canvas = canvasRef.current!;
    applyPanDelta(dx, dy, canvas.clientWidth, canvas.clientHeight);
  }, [applyPanDelta]);

  const handleMouseUp = useCallback(() => { mouseRef.current = null; }, []);

  // Touch pan + pinch (needs passive:false to prevent page scroll)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      touchRef.current = Array.from(e.touches).map(t => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
      if (e.touches.length === 2) {
        const [a, b] = touchRef.current;
        pinchDistRef.current = Math.hypot(b.x - a.x, b.y - a.y);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const newTouches = Array.from(e.touches).map(t => ({ id: t.identifier, x: t.clientX, y: t.clientY }));

      if (newTouches.length === 1 && touchRef.current.length === 1) {
        const prev = touchRef.current[0];
        const curr = newTouches[0];
        applyPanDelta(curr.x - prev.x, curr.y - prev.y, canvas.clientWidth, canvas.clientHeight);
      } else if (newTouches.length === 2 && pinchDistRef.current !== null) {
        const [a, b] = newTouches;
        const newDist = Math.hypot(b.x - a.x, b.y - a.y);
        const ratio = newDist / pinchDistRef.current;
        pinchDistRef.current = newDist;
        const adj = adjustRef.current;
        onChangeRef.current({ ...adj, zoom: Math.max(1, Math.min(8, adj.zoom * ratio)) });
      }

      touchRef.current = newTouches;
    };

    const onTouchEnd = (e: TouchEvent) => {
      touchRef.current = Array.from(e.touches).map(t => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
      if (e.touches.length < 2) pinchDistRef.current = null;
    };

    const opts: AddEventListenerOptions = { passive: false };
    canvas.addEventListener('touchstart', onTouchStart as EventListener, opts);
    canvas.addEventListener('touchmove', onTouchMove as EventListener, opts);
    canvas.addEventListener('touchend', onTouchEnd as EventListener, opts);
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart as EventListener, opts);
      canvas.removeEventListener('touchmove', onTouchMove as EventListener, opts);
      canvas.removeEventListener('touchend', onTouchEnd as EventListener, opts);
    };
  }, [applyPanDelta]);

  return (
    <div className="border-t border-[#E5E5E5] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 border-b border-[#E5E5E5]">
        <span className="text-[13px] font-medium text-[#1A1A1A]">칸 {slotIndex + 1} 조정</span>
        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center text-[#8A8A8A]"
          aria-label="닫기"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l12 12M15 3L3 15" />
          </svg>
        </button>
      </div>

      {/* Preview canvas */}
      <div className="flex justify-center px-4 pt-4">
        <canvas
          ref={canvasRef}
          className="rounded-xl cursor-grab active:cursor-grabbing select-none"
          style={{ maxHeight: '200px', width: 'auto', display: 'block' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <p className="text-center text-[13px] text-[#8A8A8A] mt-2">드래그로 위치 조정 · 핀치로 줌</p>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <span className="text-[13px] text-[#8A8A8A] w-6 shrink-0">줌</span>
        <input
          type="range"
          min="1"
          max="8"
          step="0.05"
          value={adjust.zoom}
          onChange={e => onChange({ ...adjust, zoom: Number(e.target.value) })}
          className="flex-1 h-1 rounded-full appearance-none bg-[#E5E5E5]
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-7
            [&::-webkit-slider-thumb]:h-7
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#1A1A1A]
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-7
            [&::-moz-range-thumb]:h-7
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[#1A1A1A]
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 pb-4 pt-3">
        <button
          onClick={() => onChange({ ...adjust, flipH: !adjust.flipH })}
          className={`flex-1 h-11 rounded-xl text-[13px] font-medium border transition-colors ${
            adjust.flipH
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
              : 'bg-white text-[#1A1A1A] border-[#E5E5E5]'
          }`}
        >
          좌우반전
        </button>
        <button
          onClick={() => onChange({ ...adjust, rotation: (adjust.rotation + 90) % 360 })}
          className="flex-1 h-11 rounded-xl text-[13px] font-medium border bg-white text-[#1A1A1A] border-[#E5E5E5]"
        >
          ↻ 90° 회전
        </button>
        <button
          onClick={() => onChange({ ...adjust, panX: 0, panY: 0, zoom: 1, flipH: false, rotation: 0 })}
          className="flex-1 h-11 rounded-xl text-[13px] font-medium border bg-white text-[#8A8A8A] border-[#E5E5E5]"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
