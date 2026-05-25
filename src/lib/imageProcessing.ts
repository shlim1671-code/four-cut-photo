// 보정 연산 (SPEC 5.3). 모든 픽셀 처리는 Canvas getImageData/putImageData 기반.
// 슬라이더 값은 중앙 0이 원본, 좌우로 +/- (grain·smoothing은 0이 원본).

export interface Adjustments {
  brightness: number;  // -100..100
  contrast: number;    // -100..100
  saturation: number;  // -100..100
  temperature: number; // -100(차갑)..100(따뜻)
  highlights: number;  // -100..100
  shadows: number;     // -100..100
  sharpen: number;     // -100(흐리게)..100(선명)
  grain: number;       // 0..100 (필름 그레인 강도)
  smoothing: number;   // 0..MAX_SMOOTHING (피부 스무딩 강도)
}

// 슬라이더로 표현할 수 없는 프리셋 고유의 구조적 효과.
export interface ToneEffects {
  monochrome: boolean; // 필름식 흑백 변환 (색별 명도 차등)
  vignette: number;    // 0..1 비네팅 강도
  fade: number;        // 0..1 들어올린 블랙(바랜 톤)
  sepia: number;       // 0..1 흑백 변환 후 세피아 틴트 강도 (monochrome일 때만 적용)
}

export const NEUTRAL_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  highlights: 0,
  shadows: 0,
  sharpen: 0,
  grain: 0,
  smoothing: 0,
};

export const NO_TONE: ToneEffects = { monochrome: false, vignette: 0, fade: 0, sepia: 0 };

// 피부 스무딩 최대 강도. 윤곽이 무너지지 않고 "살짝 매끄러운" 수준에 머물도록 보수적으로 둔다.
export const MAX_SMOOTHING = 20;

// 피부 보정 토글 on일 때의 고정 강도. 슬라이더 최대치의 약 30% (자연스러운 수준).
// 사용자에게 슬라이더를 노출하지 않는다.
export const SKIN_SMOOTHING_ON = 6;

// 필름식 흑백 변환 가중치 (R0.4 G0.4 B0.2). 표준 luma보다 적색을 올려 피부가 밝게 나오게 한다.
const MONO_R = 0.4;
const MONO_G = 0.4;
const MONO_B = 0.2;

export function isNeutral(adj: Adjustments, tone: ToneEffects): boolean {
  return (
    adj.brightness === 0 &&
    adj.contrast === 0 &&
    adj.saturation === 0 &&
    adj.temperature === 0 &&
    adj.highlights === 0 &&
    adj.shadows === 0 &&
    adj.sharpen === 0 &&
    adj.grain === 0 &&
    adj.smoothing === 0 &&
    !tone.monochrome &&
    tone.vignette === 0 &&
    tone.fade === 0 &&
    tone.sepia === 0
  );
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// 경계는 살리고 평평한 면만 매끄럽게 (surface blur 근사 = 휘도 차 기반 bilateral).
function smoothSurface(data: Uint8ClampedArray, w: number, h: number, strength: number): void {
  const radius = 2;
  const norm = Math.min(1, strength / MAX_SMOOTHING);
  // 블렌드 상한을 둬서 최대로 올려도 원본을 일부 유지 — 윤곽이 무너지지 않게.
  const amount = norm * 0.7;
  // range(색차) 가중치를 보수적으로: 작은 sigma는 평평한 피부 면만 흐리고
  // 턱선·이목구비처럼 명암 차가 큰 경계는 가중치를 급격히 떨어뜨려 보존한다.
  // sigma를 더 좁혀 경계 보존을 강화 — 강도를 최대로 올려도 윤곽이 살아있게.
  const sigmaRange = 4 + norm * 3;

  const rangeLUT = new Float32Array(256);
  for (let d = 0; d < 256; d++) {
    rangeLUT[d] = Math.exp(-(d * d) / (2 * sigmaRange * sigmaRange));
  }
  // 경계로 의심되는 큰 휘도 차(임계 이상)는 가중치를 완전히 0으로 — 엣지 누설 차단.
  const edgeCutoff = 24;

  const lum = new Uint8Array(w * h);
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    lum[p] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
  }

  const out = new Uint8ClampedArray(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const center = lum[p];
      let accR = 0, accG = 0, accB = 0, wsum = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const np = ny * w + nx;
          const diff = Math.abs(center - lum[np]);
          if (diff >= edgeCutoff) continue; // 경계 너머 픽셀은 섞지 않는다
          const weight = rangeLUT[diff];
          const ni = np * 4;
          accR += data[ni] * weight;
          accG += data[ni + 1] * weight;
          accB += data[ni + 2] * weight;
          wsum += weight;
        }
      }
      const i = p * 4;
      out[i] = data[i] * (1 - amount) + (accR / wsum) * amount;
      out[i + 1] = data[i + 1] * (1 - amount) + (accG / wsum) * amount;
      out[i + 2] = data[i + 2] * (1 - amount) + (accB / wsum) * amount;
    }
  }
  data.set(out);
}

// 밝기/대비/색온도/하이라이트/섀도우/채도/흑백/페이드 — 픽셀 단위 1패스.
function applyTone(data: Uint8ClampedArray, adj: Adjustments, tone: ToneEffects): void {
  const bAdd = adj.brightness * 2.55;
  const C = Math.max(-255, Math.min(255, adj.contrast * 1.28));
  const cf = (259 * (C + 255)) / (255 * (259 - C));
  const tWarm = adj.temperature * 0.5;
  const satAmt = 1 + adj.saturation / 100;
  const hi = adj.highlights;
  const sh = adj.shadows;
  const fadeFloor = tone.fade * 38;
  const fadeTop = 255 - tone.fade * 12;
  const fadeScale = (fadeTop - fadeFloor) / 255;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    r += bAdd; g += bAdd; b += bAdd;

    r = cf * (r - 128) + 128;
    g = cf * (g - 128) + 128;
    b = cf * (b - 128) + 128;

    r += tWarm; b -= tWarm;

    if (hi !== 0 || sh !== 0) {
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const delta = hi * smoothstep(0.5, 1, lum) + sh * (1 - smoothstep(0, 0.5, lum));
      r += delta; g += delta; b += delta;
    }

    if (tone.monochrome) {
      const gray = MONO_R * r + MONO_G * g + MONO_B * b;
      if (tone.sepia > 0) {
        const s = tone.sepia;
        r = gray * (1 + 0.2 * s);
        g = gray * (1 + 0.05 * s);
        b = gray * (1 - 0.18 * s);
      } else {
        r = gray; g = gray; b = gray;
      }
    } else if (satAmt !== 1) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satAmt;
      g = gray + (g - gray) * satAmt;
      b = gray + (b - gray) * satAmt;
    }

    if (tone.fade > 0) {
      r = fadeFloor + r * fadeScale;
      g = fadeFloor + g * fadeScale;
      b = fadeFloor + b * fadeScale;
    }

    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

// 가벼운 언샤프 마스크. 양수=선명, 음수=흐리게.
function applySharpen(data: Uint8ClampedArray, w: number, h: number, sharpen: number): void {
  const strength = sharpen / 100;
  const src = new Uint8ClampedArray(data);

  const blurAt = (x: number, y: number, c: number): number => {
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = Math.min(h - 1, Math.max(0, y + dy));
      for (let dx = -1; dx <= 1; dx++) {
        const nx = Math.min(w - 1, Math.max(0, x + dx));
        sum += src[(ny * w + nx) * 4 + c];
      }
    }
    return sum / 9;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const orig = src[i + c];
        const blur = blurAt(x, y, c);
        if (strength > 0) {
          data[i + c] = orig + strength * 1.2 * (orig - blur);
        } else {
          const a = Math.min(1, -strength);
          data[i + c] = orig * (1 - a) + blur * a;
        }
      }
    }
  }
}

function applyVignette(data: Uint8ClampedArray, w: number, h: number, amount: number): void {
  const cx = w / 2, cy = h / 2;
  const maxD = Math.hypot(cx, cy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, y - cy) / maxD;
      const factor = 1 - amount * smoothstep(0.5, 1, d) * 0.7;
      const i = (y * w + x) * 4;
      data[i] *= factor; data[i + 1] *= factor; data[i + 2] *= factor;
    }
  }
}

// 단색(휘도) 노이즈 = 필름 그레인 느낌.
function applyGrain(data: Uint8ClampedArray, grain: number): void {
  const amt = (grain / 100) * 40;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 2 * amt;
    data[i] += n; data[i + 1] += n; data[i + 2] += n;
  }
}

export function processImageData(
  imageData: ImageData,
  adj: Adjustments,
  tone: ToneEffects,
): void {
  const { data, width, height } = imageData;
  if (adj.smoothing > 0) smoothSurface(data, width, height, adj.smoothing);
  applyTone(data, adj, tone);
  if (adj.sharpen !== 0) applySharpen(data, width, height, adj.sharpen);
  if (tone.vignette > 0) applyVignette(data, width, height, tone.vignette);
  if (adj.grain > 0) applyGrain(data, adj.grain);
}

function sourceSize(source: HTMLImageElement | HTMLCanvasElement): { w: number; h: number } {
  if (source instanceof HTMLCanvasElement) return { w: source.width, h: source.height };
  return { w: source.naturalWidth, h: source.naturalHeight };
}

// 소스 이미지를 maxSide 이하로 다운스케일한 뒤 보정을 적용한 캔버스를 반환.
// 미리보기는 가벼운 다운스케일 이미지에, 최종 export는 원본 해상도에 적용 (SPEC 6).
export function renderAdjusted(
  source: HTMLImageElement | HTMLCanvasElement,
  adj: Adjustments,
  tone: ToneEffects,
  maxSide: number,
): HTMLCanvasElement {
  const { w: sw, h: sh } = sourceSize(source);
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, w, h);

  const id = ctx.getImageData(0, 0, w, h);
  processImageData(id, adj, tone);
  ctx.putImageData(id, 0, 0);
  return canvas;
}
