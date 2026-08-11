export interface FrameSlot {
  x: number;
  y: number;
  w: number;
  h: number;
  // 칸 자체를 중심 기준으로 기울인다(degrees). 폴라로이드처럼 비스듬한 배치용.
  // SlotAdjust.rotation(사용자가 사진을 90도씩 돌리는 값)과는 다른 개념이다.
  // 없으면 0.
  tilt?: number;
}

export interface FrameDecoration {
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  font?: string;
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FrameDateStamp {
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number; // 프레임 폭 대비 비율
  color: string;
  // 토큰: YYYY YY MM DD HH mm ss (예: 'YYYY.MM.DD')
  format: string;
}

export interface FrameDefinition {
  id: string;
  name: string;
  aspectRatio: number;
  background: string;
  // 배경 이미지 경로. 있으면 background(단색) 위에 프레임 전체 영역으로 그린다.
  // 로드에 실패하면 background 단색만 남는다.
  backgroundImage?: string;
  // 전경 이미지 경로(투명 PNG 전제). 칸 사진 위에 프레임 전체 영역으로 덮어
  // 그린다. backgroundImage와 같은 스케일/좌표계를 쓴다.
  foregroundImage?: string;
  // 있으면 전경 이미지 위에 렌더 시각의 날짜를 그린다.
  dateStamp?: FrameDateStamp;
  borderRadius?: number;
  slots: FrameSlot[];
  decorations?: FrameDecoration[];
}

export interface SlotAdjust {
  panX: number;    // fraction of visible area; 0 = centered
  panY: number;
  zoom: number;    // ≥ 1; 1 = cover-fit
  flipH: boolean;
  rotation: number; // 0 | 90 | 180 | 270
}

export const DEFAULT_ADJUST: SlotAdjust = {
  panX: 0,
  panY: 0,
  zoom: 1,
  flipH: false,
  rotation: 0,
};
