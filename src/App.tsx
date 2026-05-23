import { useCallback, useState } from 'react';
import PhotoInput from './components/PhotoInput';
import CanvasPreview from './components/CanvasPreview';
import FramePicker from './components/FramePicker';
import SlotEditor from './components/SlotEditor';
import { frames } from './frames/definitions';
import type { FrameDefinition, SlotAdjust } from './frames/types';
import { DEFAULT_ADJUST } from './frames/types';

function makeDefaultAdjusts(count: number): SlotAdjust[] {
  return Array.from({ length: count }, () => ({ ...DEFAULT_ADJUST }));
}

function App() {
  const [images, setImages] = useState<string[]>([]);
  const [frame, setFrame] = useState<FrameDefinition>(frames[0]);
  const [slotAdjusts, setSlotAdjusts] = useState<SlotAdjust[]>(() => makeDefaultAdjusts(4));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const handleImagesChange = useCallback((imgs: string[]) => setImages(imgs), []);

  const handleFrameChange = useCallback((f: FrameDefinition) => {
    setFrame(f);
    setSelectedSlot(null);
  }, []);

  const handleSlotClick = useCallback((index: number) => {
    setSelectedSlot(prev => (prev === index ? null : index));
  }, []);

  const handleAdjustChange = useCallback((index: number, adj: SlotAdjust) => {
    setSlotAdjusts(prev => {
      const next = [...prev];
      next[index] = adj;
      return next;
    });
  }, []);

  const activeSlot = selectedSlot !== null && frame.slots[selectedSlot] && images[selectedSlot]
    ? selectedSlot
    : null;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden border border-[#E5E5E5]">
        <div className="p-4 border-b border-[#E5E5E5]">
          <h1 className="text-lg font-medium text-[#1A1A1A]">4컷 사진</h1>
        </div>

        {/* Preview */}
        <div className="p-4 bg-[#F5F5F5] flex justify-center">
          <div style={{ width: '200px' }}>
            <CanvasPreview
              frame={frame}
              images={images}
              adjusts={slotAdjusts}
              selectedSlot={selectedSlot}
              onSlotClick={handleSlotClick}
            />
          </div>
        </div>
        {selectedSlot !== null && images[selectedSlot] == null && (
          <p className="text-center text-[13px] text-[#8A8A8A] pb-2">
            먼저 칸 {(selectedSlot ?? 0) + 1}에 사진을 추가하세요
          </p>
        )}

        {/* Slot editor (shown when a filled slot is selected) */}
        {activeSlot !== null && (
          <SlotEditor
            slotIndex={activeSlot}
            image={images[activeSlot]}
            adjust={slotAdjusts[activeSlot] ?? DEFAULT_ADJUST}
            slot={frame.slots[activeSlot]}
            onChange={adj => handleAdjustChange(activeSlot, adj)}
            onClose={() => setSelectedSlot(null)}
          />
        )}

        <PhotoInput onImagesChange={handleImagesChange} />

        <div className="border-t border-[#E5E5E5]">
          <p className="px-4 pt-4 text-[13px] text-[#8A8A8A]">프레임 선택</p>
          <FramePicker selectedId={frame.id} onSelect={handleFrameChange} />
        </div>
      </div>
    </div>
  );
}

export default App;
