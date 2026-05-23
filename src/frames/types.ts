export interface FrameSlot {
  x: number;
  y: number;
  w: number;
  h: number;
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

export interface FrameDefinition {
  id: string;
  name: string;
  aspectRatio: number;
  background: string;
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
