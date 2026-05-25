// 헤드리스 검증: 필터 프리셋 6종이 정의되고 각각 실제로 적용되는지 확인한다.
// 실행: node test/presets.test.mjs
import assert from 'node:assert';
import { filterPresets } from '../src/lib/filters.ts';
import {
  processImageData,
  NEUTRAL_ADJUSTMENTS,
} from '../src/lib/imageProcessing.ts';

const W = 16;
const H = 16;

// 알록달록한 그라데이션 — 보정이 색/명도에 미치는 영향을 드러낸다.
function makeImage() {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      data[i] = (x * 17) % 256;
      data[i + 1] = (y * 13 + 40) % 256;
      data[i + 2] = (x * y) % 256;
      data[i + 3] = 255;
    }
  }
  return { data, width: W, height: H };
}

function applyPreset(preset) {
  const img = makeImage();
  const adj = { ...NEUTRAL_ADJUSTMENTS, ...preset.adjustments };
  processImageData(img, adj, preset.tone);
  return img.data;
}

function diffFromOriginal(d) {
  const orig = makeImage().data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    sum += Math.abs(d[i] - orig[i]) + Math.abs(d[i + 1] - orig[i + 1]) + Math.abs(d[i + 2] - orig[i + 2]);
  }
  return sum / (W * H);
}

// 1) 정확히 6종이 정의돼 있고 id가 모두 고유하다.
assert.strictEqual(filterPresets.length, 6, `프리셋이 6종이 아님: ${filterPresets.length}`);
const ids = filterPresets.map((p) => p.id);
assert.strictEqual(new Set(ids).size, 6, '프리셋 id 중복');
console.log('프리셋:', filterPresets.map((p) => p.name).join(', '));

for (const preset of filterPresets) {
  const d = applyPreset(preset);
  const delta = diffFromOriginal(d);
  if (preset.id === 'original') {
    // 2) 원본은 보정이 전혀 없어야 한다.
    assert.strictEqual(delta, 0, '원본 프리셋이 픽셀을 변경함');
  } else {
    // 3) 나머지는 실제로 화면을 바꿔야 한다.
    assert.ok(delta > 1, `${preset.name} 프리셋이 거의 적용되지 않음 (Δ=${delta.toFixed(2)})`);
  }
  console.log(`  ${preset.name}: 평균 채널 변화 ${delta.toFixed(1)}`);
}

// 4) 흑백 계열은 무채색에 가깝다 (R≈G≈B). 세피아는 따뜻해야 한다 (평균 R > 평균 B).
function channelMeans(d) {
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  return { r: r / n, g: g / n, b: b / n };
}

const filmBw = filterPresets.find((p) => p.id === 'film-bw');
const fm = channelMeans(applyPreset(filmBw));
assert.ok(Math.abs(fm.r - fm.b) < 6, `필름 흑백이 무채색이 아님 (R${fm.r.toFixed(0)} B${fm.b.toFixed(0)})`);

const sepia = filterPresets.find((p) => p.id === 'classic-sepia');
const sm = channelMeans(applyPreset(sepia));
assert.ok(sm.r - sm.b > 8, `세피아가 따뜻하지 않음 (R${sm.r.toFixed(0)} B${sm.b.toFixed(0)})`);

console.log('PASS — 프리셋 6종 모두 적용 확인 (원본 무변화, 흑백 무채색, 세피아 따뜻함)');
