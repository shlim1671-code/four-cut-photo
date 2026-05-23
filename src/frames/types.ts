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
