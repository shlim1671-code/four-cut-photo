import { useCallback, useState } from 'react';
import type { FrameDefinition, SlotAdjust } from '../../frames/types';
import type { Adjustments, ToneEffects } from '../../lib/imageProcessing';
import { isNeutral, renderAdjusted } from '../../lib/imageProcessing';
import { composite } from '../../lib/compositor';

const MAX_EXPORT_SIDE = 2400;

interface ExportButtonProps {
  frame: FrameDefinition;
  images: string[];
  slotAdjusts: SlotAdjust[];
  adjustments: Adjustments;
  tone: ToneEffects;
}

export default function ExportButton({
  frame,
  images,
  slotAdjusts,
  adjustments,
  tone,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const loaded = await Promise.all(
        frame.slots.map((_, i) => {
          const src = images[i];
          if (!src) return Promise.resolve(null);
          return new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
          });
        })
      );

      const processed = loaded.map((img) =>
        img && !isNeutral(adjustments, tone)
          ? renderAdjusted(img, adjustments, tone, MAX_EXPORT_SIDE)
          : img
      );

      const canvas = document.createElement('canvas');
      composite(canvas, frame, processed, MAX_EXPORT_SIDE, slotAdjusts);

      const date = new Date().toISOString().slice(0, 10);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `fourcut-${date}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  }, [frame, images, slotAdjusts, adjustments, tone]);

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="w-full bg-[#1A1A1A] text-white rounded-xl text-base font-medium disabled:opacity-50"
      style={{ minHeight: 44 }}
    >
      {exporting ? '저장 중…' : 'PNG 저장'}
    </button>
  );
}
