import { useState } from 'react';
import type { FrameDefinition } from '../../frames/types';
import { frames } from '../../frames/definitions';
import CanvasPreview from '../CanvasPreview';

interface FramePickerProps {
  selectedId: string;
  onSelect: (frame: FrameDefinition) => void;
}

const CAROUSEL_HEIGHT = 440;

export default function FramePicker({ selectedId, onSelect }: FramePickerProps) {
  const startIndex = Math.max(0, frames.findIndex((f) => f.id === selectedId));
  const [idx, setIdx] = useState(startIndex);

  return (
    <div className="py-4 select-none">
      {/* Carousel viewport */}
      <div className="relative overflow-hidden" style={{ height: CAROUSEL_HEIGHT }}>
        {frames.map((frame, i) => (
          <button
            key={frame.id}
            type="button"
            aria-label={frame.name}
            onClick={() => (i === idx ? onSelect(frame) : setIdx(i))}
            className="absolute top-0 h-full flex items-center justify-center focus:outline-none"
            style={{
              width: '80%',
              left: `calc(${(i - idx) * 80 + 10}%)`,
              transition: 'left 0.3s ease-out',
            }}
          >
            {/* 높이를 CAROUSEL_HEIGHT로 채우되, 슬라이드 폭을 넘으면 폭에 맞춰 줄인다.
                (height:100% + aspect-ratio는 폭이 max-width에 걸려도 높이가 안 줄어
                가로로 넓은 프레임이 위로 붙고 아래에 빈칸이 남는다) */}
            <div
              style={{
                width: `min(100%, ${CAROUSEL_HEIGHT * frame.aspectRatio}px)`,
              }}
            >
              <CanvasPreview frame={frame} images={[]} />
            </div>
          </button>
        ))}

        {/* Prev arrow */}
        {idx > 0 && (
          <button
            type="button"
            aria-label="이전 프레임"
            onClick={() => setIdx((i) => i - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 text-3xl text-[#1A1A1A]"
          >
            ‹
          </button>
        )}

        {/* Next arrow */}
        {idx < frames.length - 1 && (
          <button
            type="button"
            aria-label="다음 프레임"
            onClick={() => setIdx((i) => i + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 text-3xl text-[#1A1A1A]"
          >
            ›
          </button>
        )}
      </div>

      {/* Frame name + position indicator */}
      <div className="text-center mt-3 px-4">
        <p className="text-[15px] font-medium text-[#1A1A1A]">{frames[idx].name}</p>
        <p className="text-[13px] text-[#8A8A8A] mt-1 tabular-nums">
          {idx + 1} / {frames.length}
        </p>
      </div>
    </div>
  );
}
