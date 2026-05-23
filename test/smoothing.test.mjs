// 헤드리스 검증: 강한 스무딩 후에도 윤곽(엣지) 명암 차가 보존되고,
// 평평한 피부 면의 미세 텍스처는 줄어드는지 확인한다.
// 실행: node test/smoothing.test.mjs
import assert from 'node:assert';
import {
  processImageData,
  NEUTRAL_ADJUSTMENTS,
  NO_TONE,
  MAX_SMOOTHING,
} from '../src/lib/imageProcessing.ts';

const W = 64;
const H = 64;

// 왼쪽 절반은 밝은 피부(180), 오른쪽 절반은 어두운 영역(80) — 가운데 세로 윤곽선.
// 양쪽 모두 ±6 미세 텍스처(피부 결)를 얹는다.
function makeImage() {
  const data = new Uint8ClampedArray(W * H * 4);
  let seed = 1;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed / 0x7fffffff) * 2 - 1; // -1..1
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const base = x < W / 2 ? 180 : 80;
      const v = Math.max(0, Math.min(255, base + rnd() * 6));
      const i = (y * W + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { data, width: W, height: H };
}

const lum = (d, i) => d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;

// 윤곽선을 가로지르는 명암 차 (경계 양옆 두 픽셀, 텍스처 평균 영향 줄이려 행 평균).
function edgeContrast(d) {
  const lx = W / 2 - 2;
  const rx = W / 2 + 1;
  let left = 0;
  let right = 0;
  for (let y = 0; y < H; y++) {
    left += lum(d, (y * W + lx) * 4);
    right += lum(d, (y * W + rx) * 4);
  }
  return (left - right) / H;
}

// 평평한 면(왼쪽 안쪽 열)의 행 간 텍스처 변동 표준편차.
function flatTexture(d) {
  const col = 12;
  const vals = [];
  for (let y = 0; y < H; y++) vals.push(lum(d, (y * W + col) * 4));
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
}

const original = makeImage();
const origEdge = edgeContrast(original.data);
const origTexture = flatTexture(original.data);

const smoothed = makeImage();
processImageData(
  smoothed,
  { ...NEUTRAL_ADJUSTMENTS, smoothing: MAX_SMOOTHING },
  NO_TONE,
);
const smEdge = edgeContrast(smoothed.data);
const smTexture = flatTexture(smoothed.data);

console.log('원본 윤곽 명암차:', origEdge.toFixed(1), '→ 스무딩 후:', smEdge.toFixed(1));
console.log('원본 피부 텍스처 σ:', origTexture.toFixed(2), '→ 스무딩 후:', smTexture.toFixed(2));

// 1) 최대 스무딩에서도 윤곽 명암 차가 90% 이상 보존되어야 한다 (턱선이 흐려지지 않음).
const edgeRatio = smEdge / origEdge;
assert.ok(edgeRatio > 0.9, `윤곽 명암 차가 무너졌다: 보존율 ${(edgeRatio * 100).toFixed(0)}%`);

// 2) 평평한 피부 면의 미세 텍스처는 실제로 줄어야 한다 (스무딩이 동작함).
assert.ok(smTexture < origTexture * 0.8, `피부 텍스처가 충분히 매끄러워지지 않았다`);

console.log(`PASS — 윤곽 보존율 ${(edgeRatio * 100).toFixed(0)}%, 텍스처 ${(smTexture / origTexture * 100).toFixed(0)}%로 감소`);
