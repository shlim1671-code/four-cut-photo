import type { FrameDefinition } from './types';
import atelierStoryboardBg from '../assets/atelier-storyboard-bg.png';
import atelierStoryboardFg from '../assets/atelier-storyboard-fg.png';

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
  {
    id: 'atelier-storyboard',
    name: '아뜰리에 스토리보드',
    // 배경·전경 PNG 1601×2400 기준. 1601/2400 = 0.6671.
    aspectRatio: 0.667,
    // 배경 이미지 로드 실패 시 남는 색. 종이 여백 평균값을 샘플링해 맞췄다.
    background: '#F0F0F0',
    backgroundImage: atelierStoryboardBg,
    foregroundImage: atelierStoryboardFg,
    // compositor는 스탬프를 textAlign 'center'·textBaseline 'middle'로 그리므로
    // x·y가 글자 중심을 가리킨다. 원본 디자인에서 잰 값은 텍스트 상자 좌상단
    // (0.760, 0.953) 기준이라, 실제 글꼴 메트릭만큼 밀어 중심 좌표로 바꿨다.
    // Special Elite는 숫자 폭이 고정이 아니라 날짜에 따라 ±1.7px 흔들리는데,
    // 2024~2035년 날짜의 중앙값으로 맞춰 오차를 최소화했다.
    dateStamp: {
      x: 0.8021,
      y: 0.9604,
      fontFamily: 'Special Elite',
      // fontSize는 프레임 폭 대비 비율이다(types.ts). 원본 33px / 1601px.
      fontSize: 0.0206,
      color: '#2A2A2A',
      format: 'YY.MM.DD',
    },
    // 배경 PNG에 그려진 패널 테두리(선 두께 4px) 안쪽에 딱 맞춘 값이다.
    // 테두리 바깥 경계가 아니라 안쪽을 써야 선이 사진에 덮이지 않는다.
    slots: [
      { x: 0.0625, y: 0.1017, w: 0.4154, h: 0.3471 },
      { x: 0.5228, y: 0.1017, w: 0.4154, h: 0.3471 },
      { x: 0.0625, y: 0.4817, w: 0.4154, h: 0.3471 },
      { x: 0.5228, y: 0.4817, w: 0.4154, h: 0.3471 },
    ],
  },
];
