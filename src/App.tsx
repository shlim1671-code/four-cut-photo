import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PhotoInput from './components/PhotoInput';
import PhotoSelect from './components/PhotoSelect';
import CanvasPreview from './components/CanvasPreview';
import FramePicker from './components/FramePicker';
import SlotEditor from './components/SlotEditor';
import AdjustPanel from './components/AdjustPanel';
import ExportButton from './components/ExportButton';
import { frames } from './frames/definitions';
import type { FrameDefinition, SlotAdjust } from './frames/types';
import { DEFAULT_ADJUST } from './frames/types';
import { NEUTRAL_ADJUSTMENTS, NO_TONE, SKIN_SMOOTHING_ON } from './lib/imageProcessing';
import { getPreset } from './lib/filters';
import { createPhoto, revokePhotos, type Photo } from './lib/photoStore';

const TOTAL_STEPS = 4;

function makeDefaultAdjusts(count: number): SlotAdjust[] {
  return Array.from({ length: count }, () => ({ ...DEFAULT_ADJUST }));
}

function App() {
  const [step, setStep] = useState(1);
  const [frame, setFrame] = useState<FrameDefinition>(frames[0]);
  // 사진의 단일 출처. 다른 곳은 전부 이 목록의 object URL만 참조한다.
  const [pool, setPool] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [slotAdjusts, setSlotAdjusts] = useState<SlotAdjust[]>(() => makeDefaultAdjusts(frames[0].slots.length));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [filterId, setFilterId] = useState('original');
  const [smoothingOn, setSmoothingOn] = useState(false);

  // 해제 시점(리셋·언마운트)에 최신 목록을 읽기 위한 ref 미러.
  const poolRef = useRef<Photo[]>([]);

  const slotCount = frame.slots.length;

  const images = useMemo(() => selected.map((i) => pool[i].url), [selected, pool]);

  const tone = useMemo(() => getPreset(filterId)?.tone ?? NO_TONE, [filterId]);
  const adjustments = useMemo(
    () => ({
      ...NEUTRAL_ADJUSTMENTS,
      ...(getPreset(filterId)?.adjustments ?? {}),
      smoothing: smoothingOn ? SKIN_SMOOTHING_ON : 0,
    }),
    [filterId, smoothingOn]
  );

  const goTo = useCallback((s: number) => {
    setSelectedSlot(null);
    setStep(s);
  }, []);

  const handleSelectFrame = useCallback((f: FrameDefinition) => {
    setFrame(f);
    setSlotAdjusts(makeDefaultAdjusts(f.slots.length));
    setSelected([]);
    setStep(2);
  }, []);

  const handleAddPhotos = useCallback((blobs: Blob[]) => {
    poolRef.current = [...poolRef.current, ...blobs.map(createPhoto)];
    setPool(poolRef.current);
  }, []);

  // 세션이 끝나면 object URL을 명시적으로 해제한다. 해제하지 않으면 Blob이
  // 탭이 닫힐 때까지 살아남아, 행사장에서 사람이 바뀔수록 메모리가 쌓인다.
  const handleReset = useCallback(() => {
    revokePhotos(poolRef.current);
    poolRef.current = [];
    setStep(1);
    setFrame(frames[0]);
    setPool([]);
    setSelected([]);
    setSlotAdjusts(makeDefaultAdjusts(frames[0].slots.length));
    setSelectedSlot(null);
    setFilterId('original');
    setSmoothingOn(false);
  }, []);

  const handleResetClick = useCallback(() => {
    if (pool.length > 0 && !window.confirm('지금까지 찍은 사진이 사라집니다. 처음으로 갈까요?')) {
      return;
    }
    handleReset();
  }, [pool.length, handleReset]);

  useEffect(() => () => revokePhotos(poolRef.current), []);

  const handleSlotClick = useCallback((index: number) => {
    setSelectedSlot((prev) => (prev === index ? null : index));
  }, []);

  const handleAdjustChange = useCallback((index: number, adj: SlotAdjust) => {
    setSlotAdjusts((prev) => {
      const next = [...prev];
      next[index] = adj;
      return next;
    });
  }, []);

  const activeSlot =
    selectedSlot !== null && frame.slots[selectedSlot] && images[selectedSlot]
      ? selectedSlot
      : null;

  const canAdvance =
    step === 2 ? pool.length >= slotCount : step === 3 ? selected.length === slotCount : true;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden border border-[#E5E5E5]">
        {/* Header: 제목 + 단계 표시 + 처음으로 */}
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <h1 className="text-lg font-medium text-[#1A1A1A]">4컷 사진</h1>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#8A8A8A] tabular-nums">
              {step}/{TOTAL_STEPS}
            </span>
            <button
              type="button"
              onClick={handleResetClick}
              className="min-h-[44px] px-3 text-[13px] text-[#8A8A8A]"
            >
              처음으로
            </button>
          </div>
        </div>

        {/* 단계 1 — 프레임 고르기 */}
        {step === 1 && (
          <div>
            <p className="px-4 pt-4 text-[13px] text-[#8A8A8A]">프레임을 고르세요</p>
            <FramePicker selectedId={frame.id} onSelect={handleSelectFrame} />
            <p className="px-4 pb-4 text-[13px] text-[#8A8A8A] text-center">
              사진은 이 기기에서만 처리되며 서버로 전송되지 않습니다
            </p>
          </div>
        )}

        {/* 단계 2 — 사진 확보 */}
        {step === 2 && (
          <div>
            <p className="px-4 pt-4 text-[13px] text-[#8A8A8A]">
              사진을 모으세요 (최소 {slotCount}장)
            </p>
            <PhotoInput photos={pool} onAddPhotos={handleAddPhotos} />
          </div>
        )}

        {/* 단계 3 — 4장 고르기 */}
        {step === 3 && (
          <div>
            <p className="px-4 pt-4 text-[13px] text-[#8A8A8A]">
              칸에 넣을 {slotCount}장을 순서대로 고르세요 ({selected.length}/{slotCount})
            </p>
            <PhotoSelect pool={pool} selected={selected} count={slotCount} onChange={setSelected} />
          </div>
        )}

        {/* 단계 4 — 마무리 */}
        {step === 4 && (
          <>
            <div className="p-4 bg-[#F5F5F5] flex justify-center">
              <div className="w-full">
                <CanvasPreview
                  frame={frame}
                  images={images}
                  adjusts={slotAdjusts}
                  adjustments={adjustments}
                  tone={tone}
                  selectedSlot={selectedSlot}
                  onSlotClick={handleSlotClick}
                />
              </div>
            </div>

            {activeSlot !== null && (
              <SlotEditor
                slotIndex={activeSlot}
                image={images[activeSlot]}
                adjust={slotAdjusts[activeSlot] ?? DEFAULT_ADJUST}
                slot={frame.slots[activeSlot]}
                frameAspect={frame.aspectRatio}
                onChange={(adj) => handleAdjustChange(activeSlot, adj)}
                onClose={() => setSelectedSlot(null)}
              />
            )}

            <div className="border-t border-[#E5E5E5]">
              <p className="px-4 pt-4 text-[13px] text-[#8A8A8A]">보정</p>
              <AdjustPanel
                filterId={filterId}
                smoothingOn={smoothingOn}
                onSelectFilter={setFilterId}
                onToggleSmoothing={setSmoothingOn}
                sampleImage={images[0] ?? null}
              />
            </div>

            <div className="border-t border-[#E5E5E5] p-4">
              <ExportButton
                frame={frame}
                images={images}
                slotAdjusts={slotAdjusts}
                adjustments={adjustments}
                tone={tone}
                onExported={handleReset}
              />
            </div>
          </>
        )}

        {/* 단계 이동 (앞뒤). 단계 1은 프레임 선택으로 진행. */}
        {step > 1 && (
          <div className="flex gap-3 p-4 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="flex-1 min-h-[44px] border border-[#E5E5E5] rounded-xl text-sm font-medium text-[#1A1A1A]"
            >
              이전
            </button>
            {step < TOTAL_STEPS && (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                disabled={!canAdvance}
                className="flex-1 min-h-[44px] bg-[#1A1A1A] text-white rounded-xl text-sm font-medium disabled:opacity-40"
              >
                다음
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
