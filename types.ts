export enum PaperSize {
  A4 = 'A4',
  A5 = 'A5',
  A6 = 'A6',
}

export interface PresetConfig {
  id: string;
  name: string;
  paperSize: PaperSize;
  paperWidthMm: number;
  paperHeightMm: number;
  cellWidthMm: number;
  cellHeightMm: number;
  gapMm: number;
  rows: number;
  cols: number;
  totalCells: number;
}

export interface PhotoData {
  id: string; // usually index like "0-0"
  file: File | null;
  imageUrl: string | null;
  
  // Transform data
  x: number; // Translate X in pixels (relative to cell)
  y: number; // Translate Y in pixels (relative to cell)
  scale: number; // Scale factor
  
  // Native dimensions needed for calculations
  nativeWidth: number;
  nativeHeight: number;
}

// Coordinate system for the grid
export interface CellPosition {
  row: number;
  col: number;
}