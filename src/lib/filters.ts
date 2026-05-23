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
      brightness: 10,
      contrast: -6,
      saturation: -8,
      temperature: 14,
      highlights: -10,
    },
    tone: { monochrome: false, vignette: 0, fade: 0.05 },
  },
  {
    // 거친 아날로그 흑백: 색별 명도 차등 + 들어올린 블랙 + 그레인 + 약한 비네팅.
    id: 'film-bw',
    name: '필름 흑백',
    adjustments: {
      contrast: 12,
      grain: 35,
    },
    tone: { monochrome: true, vignette: 0.25, fade: 0.18 },
  },
  {
    // 따뜻하게 바랜 필름.
    id: 'vintage',
    name: '빈티지 컬러',
    adjustments: {
      saturation: -22,
      temperature: 22,
      contrast: -8,
      grain: 18,
    },
    tone: { monochrome: false, vignette: 0.12, fade: 0.16 },
  },
  {
    // 차분한 청록 기운.
    id: 'cool',
    name: '쿨톤',
    adjustments: {
      temperature: -28,
      saturation: -6,
      contrast: 4,
    },
    tone: NO_TONE,
  },
];

export function getPreset(id: string): FilterPreset | undefined {
  return filterPresets.find((p) => p.id === id);
}
