export interface ScreenshotElement {
  id: string;
  type: "screenshot";
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  cornerRadius: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export interface TextElement {
  id: string;
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  fill: string;
  align: "left" | "center" | "right";
  lineHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface AccentElement {
  id: string;
  type: "accent";
  shape: "rect" | "circle" | "roundedRect";
  fill: string;
  cornerRadius: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export type CanvasElement = ScreenshotElement | TextElement | AccentElement;

export interface CanvasState {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImageUrl?: string;
  elements: CanvasElement[];
}

export type CanvasAction =
  | { type: "SET_STATE"; payload: CanvasState }
  | { type: "SET_BACKGROUND_COLOR"; payload: string }
  | { type: "SET_BACKGROUND_IMAGE"; payload: string | undefined }
  | { type: "ADD_ELEMENT"; payload: CanvasElement }
  | { type: "UPDATE_ELEMENT"; payload: { id: string } & Partial<CanvasElement> }
  | { type: "REMOVE_ELEMENT"; payload: string }
  | { type: "REORDER_ELEMENT"; payload: { id: string; direction: "up" | "down" } };
