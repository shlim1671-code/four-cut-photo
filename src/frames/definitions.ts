import type { FrameDefinition } from './types';

// 좌표는 실제 출력물(포토이즘·이터널로그)을 픽셀 단위로 측정해 얻은 값이다.
export const frames: FrameDefinition[] = [
  {
    id: 'basic-strip',
    name: '1×4 스트립',
    aspectRatio: 0.333,
    background: '#1a1a1a',
    slots: [
      { x: 0.08, y: 0.056, w: 0.84, h: 0.226 },
      { x: 0.08, y: 0.287, w: 0.84, h: 0.226 },
      { x: 0.08, y: 0.517, w: 0.84, h: 0.226 },
      { x: 0.08, y: 0.748, w: 0.84, h: 0.226 },
    ],
  },
  {
    id: 'basic-grid',
    name: '2×2 그리드',
    aspectRatio: 0.75,
    background: '#1a1a1a',
    slots: [
      { x: 0.117, y: 0.140, w: 0.37, h: 0.336 },
      { x: 0.513, y: 0.140, w: 0.37, h: 0.336 },
      { x: 0.117, y: 0.509, w: 0.37, h: 0.336 },
      { x: 0.513, y: 0.509, w: 0.37, h: 0.336 },
    ],
  },
  {
    id: 'compact-grid',
    name: '2×2 꽉참',
    aspectRatio: 0.667,
    background: '#1a1a1a',
    slots: [
      { x: 0.06, y: 0.10, w: 0.42, h: 0.35 },
      { x: 0.52, y: 0.10, w: 0.42, h: 0.35 },
      { x: 0.06, y: 0.48, w: 0.42, h: 0.35 },
      { x: 0.52, y: 0.48, w: 0.42, h: 0.35 },
    ],
  },
  {
    id: 'six-grid',
    name: '2×3 여섯컷',
    aspectRatio: 0.75,
    background: '#1a1a1a',
    slots: [
      { x: 0.319, y: 0.076, w: 0.29, h: 0.272 },
      { x: 0.622, y: 0.076, w: 0.29, h: 0.272 },
      { x: 0.319, y: 0.363, w: 0.29, h: 0.272 },
      { x: 0.622, y: 0.363, w: 0.29, h: 0.272 },
      { x: 0.319, y: 0.649, w: 0.29, h: 0.272 },
      { x: 0.622, y: 0.649, w: 0.29, h: 0.272 },
    ],
  },
];
