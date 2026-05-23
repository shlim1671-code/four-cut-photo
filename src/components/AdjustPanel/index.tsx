import { useEffect, useRef, useState } from 'react';
import type { Adjustments } from '../../lib/imageProcessing';
import {
  MAX_SMOOTHING,
  NEUTRAL_ADJUSTMENTS,
  renderAdjusted,
} from '../../lib/imageProcessing';
import { filterPresets, type FilterPreset } from '../../lib/filters';
import heroSample from '../../assets/hero.png';

interface AdjustPanelProps {
  adjustments: Adjustments;
  filterId: string;
  onChangeAdjustments: (a: Adjustments) => void;
  onSelectFilter: (id: string) => void;
  sampleImage?: string | null;
}

interface SliderConfig {
  key: keyof Adjustments;
  label: string;
  min: number;
  max: number;
}

// 슬라이더 7종 (밝기~선명도는 중앙 0, 좌우 +/-) + 그레인(0~).
const SLIDERS: SliderConfig[] = [
  { key: 'brightness', label: '밝기', min: -100, max: 100 },
  { key: 'contrast', label: '대비', min: -100, max: 100 },
  { key: 'saturation', label: '채도', min: -100, max: 100 },
  { key: 'temperature', label: '색온도', min: -100, max: 100 },
  { key: 'highlights', label: '하이라이트', min: -100, max: 100 },
  { key: 'shadows', label: '섀도우', min: -100, max: 100 },
  { key: 'sharpen', label: '선명도', min: -100, max: 100 },
  { key: 'grain', label: '필름 그레인', min: 0, max: 100 },
];

const SLIDER_CLASS = `flex-1 h-1 rounded-full appearance-none bg-[#E5E5E5]
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
  [&::-moz-range-thumb]:cursor-pointer`;

function AdjustSlider({
  label, value, min, max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <span className="text-[13px] text-[#8A8A8A] w-20 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={SLIDER_CLASS}
      />
      <span className="text-[13px] text-[#1A1A1A] w-8 text-right shrink-0 tabular-nums">
        {value}
      </span>
    </div>
  );
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
  adjustments,
  filterId,
  onChangeAdjustments,
  onSelectFilter,
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

  const setField = (key: keyof Adjustments, v: number) =>
    onChangeAdjustments({ ...adjustments, [key]: v });

  const reset = () => {
    onChangeAdjustments({ ...NEUTRAL_ADJUSTMENTS });
    onSelectFilter('original');
  };

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

      {/* 보정 슬라이더 */}
      <div className="border-t border-[#E5E5E5] py-1">
        {SLIDERS.map((s) => (
          <AdjustSlider
            key={s.key}
            label={s.label}
            value={adjustments[s.key]}
            min={s.min}
            max={s.max}
            onChange={(v) => setField(s.key, v)}
          />
        ))}
      </div>

      {/* 피부 스무딩 (강도 제한) */}
      <div className="border-t border-[#E5E5E5] py-1">
        <AdjustSlider
          label="피부 보정"
          value={adjustments.smoothing}
          min={0}
          max={MAX_SMOOTHING}
          onChange={(v) => setField('smoothing', v)}
        />
      </div>

      <div className="px-4 py-3 border-t border-[#E5E5E5]">
        <button
          type="button"
          onClick={reset}
          className="w-full h-11 rounded-xl text-[13px] font-medium border bg-white text-[#8A8A8A] border-[#E5E5E5]"
        >
          보정 초기화
        </button>
      </div>
    </div>
  );
}
