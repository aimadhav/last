
export interface Point {
  x: number;
  y: number;
}

export type WhiteboardElementType = 
  | "path" 
  | "rectangle" 
  | "circle" 
  | "arrow" 
  | "text" 
  | "note"
  | "image";

export interface BaseElement {
  id: string;
  type: WhiteboardElementType;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface PathElement extends BaseElement {
  type: "path";
  points: Point[];
}

export interface ShapeElement extends BaseElement {
  type: "rectangle" | "circle" | "arrow";
  startPoint: Point;
  endPoint: Point;
}

export interface TextElement extends BaseElement {
  type: "text";
  position: Point;
  text: string;
  width?: number;
  height?: number;
  align?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
  isUnderlined?: boolean;
}

export interface NoteElement extends BaseElement {
  type: "note";
  position: Point;
  text: string;
  width?: number;
  height?: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  position: Point;
  src: string;
  width: number;
  height: number;
  rotation: number;
}

export type Element = PathElement | ShapeElement | TextElement | NoteElement | ImageElement;

export interface WhiteboardProject {
  id: string;
  name: string;
  elements: Element[];
  createdAt: Date;
  updatedAt: Date;
}
