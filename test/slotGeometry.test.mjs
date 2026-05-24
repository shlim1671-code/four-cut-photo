// 헤드리스 검증: SlotEditor 미리보기와 compositor 최종 합성이 칸 조정값을
// "동일한 구도"로 해석하는지 확인한다.
// - 미리보기 해상도(작게)와 export 해상도(2400/480)가 달라도 잘리는 영역(source crop)이
//   비율상 동일해야 한다.
// - 위치(pan)·줌(zoom)·반전(flipH)·회전(rotation) 모든 조합에서 성립해야 한다.
// 실행: node test/slotGeometry.test.mjs
import assert from 'node:assert';
import { computeSlotCrop } from '../src/lib/slotGeometry.ts';
import { frames } from '../src/frames/definitions.ts';

const PREVIEW_H = 400; // SlotEditor의 미리보기 높이

// compositor가 정하는 캔버스 크기 → 칸의 실제 픽셀 크기.
function compositorSlotDims(frame, slot, longestSidePx) {
  const ar = frame.aspectRatio;
  const canvasW = ar >= 1 ? longestSidePx : Math.round(longestSidePx * ar);
  const canvasH = ar >= 1 ? Math.round(longestSidePx / ar) : longestSidePx;
  return { sw: slot.w * canvasW, sh: slot.h * canvasH };
}

// SlotEditor가 정하는 미리보기 캔버스 크기 (수정 후 공식).
function previewSlotDims(frame, slot) {
  const slotAspect = (slot.w / slot.h) * frame.aspectRatio;
  return { sw: Math.round(PREVIEW_H * slotAspect), sh: PREVIEW_H };
}

// 원본 이미지 크기 (세로 사진 가정).
const IW = 3000;
const IH = 4000;

const ADJ_CASES = {
  '위치(pan)': { panX: 0.3, panY: -0.25, zoom: 1, flipH: false, rotation: 0 },
  '줌(zoom)': { panX: 0, panY: 0, zoom: 2.5, flipH: false, rotation: 0 },
  '반전(flipH)': { panX: 0.15, panY: 0.1, zoom: 1.4, flipH: true, rotation: 0 },
  '회전90': { panX: 0.1, panY: -0.1, zoom: 1.3, flipH: false, rotation: 90 },
  '회전270+반전': { panX: -0.2, panY: 0.2, zoom: 1.8, flipH: true, rotation: 270 },
};

let checks = 0;

for (const frame of frames) {
  for (let s = 0; s < frame.slots.length; s++) {
    const slot = frame.slots[s];

    // 미리보기 캔버스 비율이 합성 시 칸의 실제 픽셀 비율과 일치하는지.
    const { sw: pSw, sh: pSh } = previewSlotDims(frame, slot);
    const { sw: cSw, sh: cSh } = compositorSlotDims(frame, slot, 2400);
    const previewAspect = pSw / pSh;
    const compositorAspect = cSw / cSh;
    assert.ok(
      Math.abs(previewAspect - compositorAspect) / compositorAspect < 0.01,
      `[${frame.id} 칸${s + 1}] 미리보기 비율(${previewAspect.toFixed(4)})이 ` +
        `합성 비율(${compositorAspect.toFixed(4)})과 다르다`
    );

    for (const [name, adj] of Object.entries(ADJ_CASES)) {
      const preview = computeSlotCrop(IW, IH, pSw, pSh, adj);
      const exp2400 = computeSlotCrop(IW, IH, cSw, cSh, adj);
      const { sw: c480Sw, sh: c480Sh } = compositorSlotDims(frame, slot, 480);
      const exp480 = computeSlotCrop(IW, IH, c480Sw, c480Sh, adj);

      // export 해상도가 달라도 source crop은 완전히 동일해야 한다 (비율 기반).
      for (const k of ['srcX', 'srcY', 'srcW', 'srcH']) {
        assert.ok(
          Math.abs(exp2400[k] - exp480[k]) < 1e-6,
          `[${frame.id} 칸${s + 1} ${name}] export 480px와 2400px의 ${k}가 다르다: ` +
            `${exp480[k]} vs ${exp2400[k]}`
        );
      }

      // 미리보기와 export의 source crop이 (캔버스 정수 반올림 오차 내에서) 일치해야 한다.
      for (const k of ['srcX', 'srcY', 'srcW', 'srcH']) {
        const tol = (k === 'srcX' || k === 'srcW' ? IW : IH) * 0.01; // 이미지 크기의 1%
        assert.ok(
          Math.abs(preview[k] - exp2400[k]) < tol,
          `[${frame.id} 칸${s + 1} ${name}] 미리보기와 합성의 ${k}가 다르다: ` +
            `${preview[k].toFixed(2)} vs ${exp2400[k].toFixed(2)} (허용 ${tol.toFixed(1)})`
        );
      }
      checks++;
    }
  }
}

console.log(`PASS — ${frames.length}개 프레임 × 칸/조정 조합 ${checks}건, 미리보기·export 구도 일치`);
