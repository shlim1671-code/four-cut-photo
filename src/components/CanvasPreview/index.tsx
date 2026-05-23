import { useEffect, useRef } from 'react';
import type { FrameDefinition } from '../../frames/types';
import type { SlotAdjust } from '../../frames/types';
import { composite } from '../../lib/compositor';

interface CanvasPreviewProps {
  frame: FrameDefinition;
  images: string[];
  adjusts?: SlotAdjust[];
  selectedSlot?: number | null;
  onSlotClick?: (index: number) => void;
}

const PREVIEW_LONGEST_SIDE = 600;

export default function CanvasPreview({
  frame,
  images,
  adjusts,
  selectedSlot,
  onSlotClick,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loaded: (HTMLImageElement | null)[] = Array(frame.slots.length).fill(null);
    loadedRef.current = loaded;
    let cancelled = false;

    const render = () => {
      if (cancelled || !canvasRef.current) return;
      composite(canvas, frame, loaded, PREVIEW_LONGEST_SIDE, adjusts);
      drawSelection(canvas, frame, selectedSlot ?? null);
    };

    render();

    images.slice(0, frame.slots.length).forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        loaded[i] = img;
        render();
      };
      img.src = src;
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, images]);

  // Re-render when adjusts or selectedSlot changes (images already loaded)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    composite(canvas, frame, loadedRef.current, PREVIEW_LONGEST_SIDE, adjusts);
    drawSelection(canvas, frame, selectedSlot ?? null);
  }, [adjusts, selectedSlot, frame]);

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
