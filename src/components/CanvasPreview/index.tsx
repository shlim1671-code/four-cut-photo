import { useEffect, useRef } from 'react';
import type { FrameDefinition } from '../../frames/types';
import { composite } from '../../lib/compositor';

interface CanvasPreviewProps {
  frame: FrameDefinition;
  images: string[];
}

const PREVIEW_LONGEST_SIDE = 600;

export default function CanvasPreview({ frame, images }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loaded: (HTMLImageElement | null)[] = Array(frame.slots.length).fill(null);
    let cancelled = false;

    const render = () => {
      if (!cancelled && canvasRef.current) {
        composite(canvas, frame, loaded, PREVIEW_LONGEST_SIDE);
      }
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
  }, [frame, images]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}
