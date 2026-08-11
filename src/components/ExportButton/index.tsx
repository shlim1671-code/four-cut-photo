import { useCallback, useEffect, useRef, useState } from 'react';
import type { FrameDefinition, SlotAdjust } from '../../frames/types';
import type { Adjustments, ToneEffects } from '../../lib/imageProcessing';
import { isNeutral, renderAdjusted } from '../../lib/imageProcessing';
import { composite, loadFrameImage } from '../../lib/compositor';
import { waitForStampFont } from '../../lib/dateStamp';
import { loadImage } from '../../lib/loadImage';
import { savePng } from '../../lib/savePng';

const MAX_EXPORT_SIDE = 2400;

const RESET_DELAY_MS = 3000;

interface ExportButtonProps {
  frame: FrameDefinition;
  images: string[];
  slotAdjusts: SlotAdjust[];
  adjustments: Adjustments;
  tone: ToneEffects;
  onExported?: () => void;
}

export default function ExportButton({
  frame,
  images,
  slotAdjusts,
  adjustments,
  tone,
  onExported,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setFailed(false);
    try {
      // 배경·전경 이미지는 미리보기와 같은 헬퍼로 로드한다(실패 시 null → 폴백).
      // 칸 사진과 달리 실패해도 저장을 막지 않는다.
      const [loaded, background, foreground] = await Promise.all([
        Promise.all(
          frame.slots.map((_, i) => {
            const src = images[i];
            if (!src) return Promise.resolve(null);
            return loadImage(src);
          })
        ),
        loadFrameImage(frame.backgroundImage),
        loadFrameImage(frame.foregroundImage),
        waitForStampFont(frame.dateStamp),
      ]);

      const processed = loaded.map((img) =>
        img && !isNeutral(adjustments, tone)
          ? renderAdjusted(img, adjustments, tone, MAX_EXPORT_SIDE)
          : img
      );

      const canvas = document.createElement('canvas');
      composite(
        canvas, frame, processed, MAX_EXPORT_SIDE, slotAdjusts, background, foreground
      );

      const date = new Date().toISOString().slice(0, 10);
      // 공유 시트를 취소하면 저장된 게 아니므로 자동 리셋도 걸지 않는다.
      if (!(await savePng(canvas, `fourcut-${date}.png`))) return;

      setSaved(true);
      if (onExported) {
        resetTimerRef.current = setTimeout(onExported, RESET_DELAY_MS);
      }
    } catch {
      // 이미지 로드 실패·지연, PNG 인코딩·공유 실패: 저장을 중단하고 다시
      // 시도할 수 있게 둔다.
      setFailed(true);
    } finally {
      setExporting(false);
    }
  }, [frame, images, slotAdjusts, adjustments, tone, onExported]);

  return (
    <>
      <button
        onClick={handleExport}
        disabled={exporting || saved}
        className="w-full bg-[#1A1A1A] text-white rounded-xl text-base font-medium disabled:opacity-50"
        style={{ minHeight: 44 }}
      >
        {exporting ? '저장 중…' : 'PNG 저장'}
      </button>
      {saved && (
        <p className="mt-2 text-[13px] text-[#1A1A1A]">
          저장됨! 3초 후 처음으로 돌아갑니다
        </p>
      )}
      {failed && (
        <p className="mt-2 text-[13px] text-[#1A1A1A]">
          저장하지 못했습니다. 다시 시도해주세요.
        </p>
      )}
    </>
  );
}
