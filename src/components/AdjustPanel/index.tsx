import { useEffect, useRef, useState } from 'react';
import { NEUTRAL_ADJUSTMENTS, renderAdjusted } from '../../lib/imageProcessing';
import { filterPresets, type FilterPreset } from '../../lib/filters';
import heroSample from '../../assets/hero.png';

interface AdjustPanelProps {
  filterId: string;
  smoothingOn: boolean;
  onSelectFilter: (id: string) => void;
  onToggleSmoothing: (on: boolean) => void;
  sampleImage?: string | null;
}

function FilterThumb({
  preset, sample, selected, onSelect,
}: {
  preset: FilterPreset;
  sample: HTMLImageElement | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sample) return;
    const adj = { ...NEUTRAL_ADJUSTMENTS, ...preset.adjustments };
    const out = renderAdjusted(sample, adj, preset.tone, 96);
    canvas.width = out.width;
    canvas.height = out.height;
    canvas.getContext('2d')!.drawImage(out, 0, 0);
  }, [sample, preset]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'flex flex-col items-center gap-1 shrink-0 rounded-xl p-1 bg-white border-2',
        selected ? 'border-[#1A1A1A]' : 'border-[#E5E5E5]',
      ].join(' ')}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F5F5F5]">
        <canvas ref={canvasRef} className="w-full h-full object-cover block" />
      </div>
      <span className="text-[13px] text-[#1A1A1A] leading-none whitespace-nowrap">
        {preset.name}
      </span>
    </button>
  );
}

export default function AdjustPanel({
  filterId,
  smoothingOn,
  onSelectFilter,
  onToggleSmoothing,
  sampleImage,
}: AdjustPanelProps) {
  const [sampleImg, setSampleImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setSampleImg(img); };
    img.src = sampleImage || heroSample;
    return () => { cancelled = true; };
  }, [sampleImage]);

  return (
    <div className="bg-white">
      {/* 필터 프리셋 */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {filterPresets.map((preset) => (
          <FilterThumb
            key={preset.id}
            preset={preset}
            sample={sampleImg}
            selected={preset.id === filterId}
            onSelect={() => onSelectFilter(preset.id)}
          />
        ))}
      </div>

      {/* 피부 보정 토글 (강도는 고정값) */}
      <button
        type="button"
        role="switch"
        aria-checked={smoothingOn}
        onClick={() => onToggleSmoothing(!smoothingOn)}
        className="w-full flex items-center justify-between px-4 min-h-[44px] py-3 border-t border-[#E5E5E5]"
      >
        <span className="text-[13px] text-[#1A1A1A]">피부 보정</span>
        <span
          className={[
            'relative h-7 w-12 rounded-full transition-colors shrink-0',
            smoothingOn ? 'bg-[#1A1A1A]' : 'bg-[#E5E5E5]',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1 h-5 w-5 rounded-full bg-white transition-all',
              smoothingOn ? 'left-6' : 'left-1',
            ].join(' ')}
          />
        </span>
      </button>
    </div>
  );
}
