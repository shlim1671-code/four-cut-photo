import type { FrameDefinition } from './types';

export const frames: FrameDefinition[] = [
  {
    id: 'portrait-strip',
    name: '세로 인생네컷',
    aspectRatio: 0.25,
    background: '#fff0f5',
    slots: [
      { x: 0.09, y: 0.020,  w: 0.82, h: 0.2255 },
      { x: 0.09, y: 0.2585, w: 0.82, h: 0.2255 },
      { x: 0.09, y: 0.497,  w: 0.82, h: 0.2255 },
      { x: 0.09, y: 0.7355, w: 0.82, h: 0.2255 },
    ],
  },
  {
    id: 'grid-2x2',
    name: '2×2 그리드',
    aspectRatio: 0.667,
    background: '#ffffff',
    slots: [
      { x: 0.06, y: 0.10, w: 0.42, h: 0.35 },
      { x: 0.52, y: 0.10, w: 0.42, h: 0.35 },
      { x: 0.06, y: 0.48, w: 0.42, h: 0.35 },
      { x: 0.52, y: 0.48, w: 0.42, h: 0.35 },
    ],
  },
  {
    id: 'white-plain',
    name: '흰색 무지',
    aspectRatio: 0.25,
    background: '#ffffff',
    slots: [
      { x: 0.09, y: 0.020,  w: 0.82, h: 0.2255 },
      { x: 0.09, y: 0.2585, w: 0.82, h: 0.2255 },
      { x: 0.09, y: 0.497,  w: 0.82, h: 0.2255 },
      { x: 0.09, y: 0.7355, w: 0.82, h: 0.2255 },
    ],
  },
  {
    id: 'dark-event',
    name: '어두운 행사용',
    aspectRatio: 0.25,
    background: '#1a1a2e',
    slots: [
      { x: 0.09, y: 0.015,  w: 0.82, h: 0.2255 },
      { x: 0.09, y: 0.2535, w: 0.82, h: 0.2255 },
      { x: 0.09, y: 0.492,  w: 0.82, h: 0.2255 },
      { x: 0.09, y: 0.7305, w: 0.82, h: 0.2255 },
    ],
    decorations: [
      {
        type: 'text',
        content: 'PHOTO BOOTH',
        x: 0.5,
        y: 0.247,
        fontSize: 0.06,
        color: '#ffffff',
        align: 'center',
      },
    ],
  },
];
