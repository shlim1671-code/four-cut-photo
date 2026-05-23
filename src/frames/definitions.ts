import type { FrameDefinition } from './types';

export const frames: FrameDefinition[] = [
  {
    id: 'portrait-strip',
    name: '세로 인생네컷',
    aspectRatio: 0.4,
    background: '#fff0f5',
    slots: [
      { x: 0.05, y: 0.05, w: 0.90, h: 0.21 },
      { x: 0.05, y: 0.28, w: 0.90, h: 0.21 },
      { x: 0.05, y: 0.51, w: 0.90, h: 0.21 },
      { x: 0.05, y: 0.74, w: 0.90, h: 0.21 },
    ],
  },
  {
    id: 'grid-2x2',
    name: '2×2 그리드',
    aspectRatio: 1.0,
    background: '#ffffff',
    slots: [
      { x: 0.04, y: 0.04, w: 0.45, h: 0.45 },
      { x: 0.51, y: 0.04, w: 0.45, h: 0.45 },
      { x: 0.04, y: 0.51, w: 0.45, h: 0.45 },
      { x: 0.51, y: 0.51, w: 0.45, h: 0.45 },
    ],
  },
  {
    id: 'white-plain',
    name: '흰색 무지',
    aspectRatio: 0.6,
    background: '#ffffff',
    slots: [
      { x: 0.08, y: 0.08,   w: 0.84, h: 0.19 },
      { x: 0.08, y: 0.295,  w: 0.84, h: 0.19 },
      { x: 0.08, y: 0.51,   w: 0.84, h: 0.19 },
      { x: 0.08, y: 0.725,  w: 0.84, h: 0.19 },
    ],
  },
  {
    id: 'dark-event',
    name: '어두운 행사용',
    aspectRatio: 0.65,
    background: '#1a1a2e',
    slots: [
      { x: 0.05, y: 0.10, w: 0.90, h: 0.19 },
      { x: 0.05, y: 0.31, w: 0.90, h: 0.19 },
      { x: 0.05, y: 0.52, w: 0.90, h: 0.19 },
      { x: 0.05, y: 0.73, w: 0.90, h: 0.19 },
    ],
    decorations: [
      {
        type: 'text',
        content: 'PHOTO BOOTH',
        x: 0.5,
        y: 0.05,
        fontSize: 0.06,
        color: '#ffffff',
        align: 'center',
      },
    ],
  },
];
