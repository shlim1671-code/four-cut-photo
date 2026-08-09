import type { Photo } from '../../lib/photoStore';

interface PhotoSelectProps {
  pool: Photo[];
  selected: number[]; // pool 인덱스, 고른 순서대로 (= 칸 순서)
  count: number;
  onChange: (selected: number[]) => void;
}

export default function PhotoSelect({ pool, selected, count, onChange }: PhotoSelectProps) {
  const toggle = (i: number) => {
    if (selected.includes(i)) {
      onChange(selected.filter((x) => x !== i));
    } else if (selected.length < count) {
      onChange([...selected, i]);
    }
  };

  if (pool.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-[13px] text-[#8A8A8A]">
        먼저 사진을 모아주세요
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {pool.map((photo, i) => {
        const order = selected.indexOf(i);
        const isSel = order >= 0;
        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => toggle(i)}
            className={[
              'relative aspect-square rounded-xl overflow-hidden border-2',
              isSel ? 'border-[#1A1A1A]' : 'border-[#E5E5E5]',
            ].join(' ')}
          >
            <img src={photo.thumbUrl} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
            {isSel && (
              <span className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-full bg-[#1A1A1A] text-white text-[13px] font-medium tabular-nums">
                {order + 1}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
