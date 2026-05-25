// 필터 프리셋 (SPEC 5.3). 각 프리셋은 슬라이더 값의 조합 + 슬라이더로 표현 못하는
// 구조적 효과(흑백/비네팅/페이드)로 정의. 프리셋 선택 후에도 슬라이더로 미세 조정 가능.
// 새 프리셋은 이 배열에 객체 하나 추가하면 끝.

import type { Adjustments, ToneEffects } from './imageProcessing';
import { NO_TONE } from './imageProcessing';

export interface FilterPreset {
  id: string;
  name: string;
  adjustments: Partial<Adjustments>; // 적용 시 슬라이더가 이 값으로 설정됨
  tone: ToneEffects;
}

export const filterPresets: FilterPreset[] = [
  {
    id: 'original',
    name: '원본',
    adjustments: {},
    tone: NO_TONE,
  },
  {
    // 한국 컬러 사진부스 느낌. 보정한 티 안 나게 화사하게.
    id: 'booth',
    name: '부스톤',
    adjustments: {
      brightness: 12,
      contrast: -10,
      saturation: -8,
      temperature: 6,
      highlights: -12,
      shadows: 10,
      sharpen: 5,
      grain: 0,
    },
    tone: NO_TONE,
  },
  {
    // 거친 모던 아날로그 흑백: 채널 가중 흑백 + 들어올린 섀도우 + 굵은 그레인 + 약한 비네팅.
    id: 'film-bw',
    name: '필름 흑백',
    adjustments: {
      contrast: 8,
      highlights: -8,
      shadows: 14,
      grain: 35,
    },
    // 비네팅 0.14 → 가장자리 약 -10% 밝기.
    tone: { monochrome: true, vignette: 0.14, fade: 0, sepia: 0 },
  },
  {
    // 따뜻하게 바랜 필름.
    id: 'vintage',
    name: '빈티지 컬러',
    adjustments: {
      brightness: 4,
      contrast: -6,
      saturation: -20,
      temperature: 10,
      highlights: -6,
      shadows: 16,
      grain: 18,
    },
    tone: NO_TONE,
  },
  {
    // 차분한 청록 기운.
    id: 'cool',
    name: '쿨톤',
    adjustments: {
      brightness: 6,
      contrast: -4,
      saturation: -10,
      temperature: -12,
      shadows: 8,
      grain: 0,
    },
    tone: NO_TONE,
  },
  {
    // 따뜻한 1920년대 빈티지: 흑백 변환 후 세피아 틴트. (필름 흑백=거친 모던과 별개 갈래)
    id: 'classic-sepia',
    name: '클래식 세피아',
    adjustments: {
      brightness: 5,
      contrast: -22,
      saturation: -88,
      temperature: 20,
      highlights: -15,
      shadows: 25,
      sharpen: -10,
      grain: 12,
    },
    tone: { monochrome: true, vignette: 0, fade: 0, sepia: 0.8 },
  },
];

export function getPreset(id: string): FilterPreset | undefined {
  return filterPresets.find((p) => p.id === id);
}
