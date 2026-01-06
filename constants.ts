import { PaperSize, PresetConfig } from './types';

// Measurements in mm
export const PRESETS: Record<string, PresetConfig> = {
  POLAROID_A4: {
    id: 'POLAROID_A4',
    name: 'A4 拍立得风格 (3x3)',
    paperSize: PaperSize.A4,
    paperWidthMm: 210,
    paperHeightMm: 297,
    cellWidthMm: 62.2,
    cellHeightMm: 90.6,
    gapMm: 3,
    rows: 3,
    cols: 3,
    totalCells: 9,
  },
  MINI_A4: {
    id: 'MINI_A4',
    name: 'A4 迷你卡片 (6x6)',
    paperSize: PaperSize.A4,
    paperWidthMm: 210,
    paperHeightMm: 297,
    cellWidthMm: 30,
    cellHeightMm: 40,
    gapMm: 3,
    rows: 6,
    cols: 6,
    totalCells: 36,
  },
  MINI_A5: {
    id: 'MINI_A5',
    name: 'A5 横向拼贴 (3x6)',
    paperSize: PaperSize.A5,
    paperWidthMm: 148,
    paperHeightMm: 210,
    cellWidthMm: 40, // Landscape
    cellHeightMm: 30,
    gapMm: 3,
    rows: 6,
    cols: 3,
    totalCells: 18,
  },
  MINI_A6: {
    id: 'MINI_A6',
    name: 'A6 口袋拼贴 (3x3)',
    paperSize: PaperSize.A6,
    paperWidthMm: 105,
    paperHeightMm: 148,
    cellWidthMm: 30,
    cellHeightMm: 40,
    gapMm: 3,
    rows: 3,
    cols: 3,
    totalCells: 9,
  }
};

export const DEFAULT_PRESET = PRESETS.POLAROID_A4;