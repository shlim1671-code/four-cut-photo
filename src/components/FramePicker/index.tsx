import type { FrameDefinition } from '../../frames/types';
import { frames } from '../../frames/definitions';
import CanvasPreview from '../CanvasPreview';

interface FramePickerProps {
  selectedId: string;
  onSelect: (frame: FrameDefinition) => void;
}

export default function FramePicker({ selectedId, onSelect }: FramePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {frames.map((frame) => {
        const selected = frame.id === selectedId;
        return (
          <button
            key={frame.id}
            onClick={() => onSelect(frame)}
            className={[
              'flex flex-col items-center gap-2 rounded-xl p-2 bg-white',
              'min-h-[44px] border-2',
              selected ? 'border-[#1A1A1A]' : 'border-[#E5E5E5]',
            ].join(' ')}
            style={{ minWidth: 44 }}
          >
            <div style={{ width: '100%' }}>
              <CanvasPreview frame={frame} images={[]} />
            </div>
            <span className="text-[13px] text-[#1A1A1A] leading-none">
              {frame.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
