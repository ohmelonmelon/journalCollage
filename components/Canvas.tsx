import React from 'react';
import { PresetConfig, PhotoData } from '../types';
import GridCell from './GridCell';

interface CanvasProps {
  preset: PresetConfig;
  photos: Map<string, PhotoData>;
  selectedCellId: string | null;
  onSelectCell: (id: string) => void;
  onUpdatePhoto: (id: string, updates: Partial<PhotoData>) => void;
  scale?: number; // Screen display scale
}

const Canvas: React.FC<CanvasProps> = ({
  preset,
  photos,
  selectedCellId,
  onSelectCell,
  onUpdatePhoto,
  scale = 1,
}) => {
  // Generate grid positions
  const renderCells = () => {
    const cells = [];
    for (let r = 0; r < preset.rows; r++) {
      for (let c = 0; c < preset.cols; c++) {
        const id = `${r}-${c}`;
        cells.push(
          <GridCell
            key={id}
            id={id}
            preset={preset}
            photoData={photos.get(id)}
            isSelected={selectedCellId === id}
            onSelect={onSelectCell}
            onUpdate={onUpdatePhoto}
          />
        );
      }
    }
    return cells;
  };

  // Calculate the layout dimensions for the wrapper
  // 1mm is approximately 3.7795 px. We use 3.78 for consistency with App.tsx
  const MM_TO_PX = 3.78;
  const scaledWidth = preset.paperWidthMm * MM_TO_PX * scale;
  const scaledHeight = preset.paperHeightMm * MM_TO_PX * scale;

  return (
    <div 
        className="relative mx-auto transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.08)] bg-white"
        style={{
            // The wrapper size matches the scaled size of the content
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
        }}
    >
        {/* The Actual Canvas Element: Scaled using transform */}
        <div 
            id="printable-canvas"
            className="paper-texture origin-top-left bg-white"
            style={{
                width: `${preset.paperWidthMm}mm`,
                height: `${preset.paperHeightMm}mm`,
                transform: `scale(${scale})`,
                // Force white background for the paper itself
            }}
        >
          <div 
            className="w-full h-full flex flex-wrap content-start items-start justify-center"
            style={{
                padding: `${preset.gapMm}mm`, // Outer padding
                gap: `${preset.gapMm}mm`,     // Gap between items
            }}
          >
            {renderCells()}
          </div>

          {/* Footer / Watermark */}
          <div className="absolute bottom-4 right-6 text-gray-300 text-[10px] font-mono no-print pointer-events-none">
            {preset.name} • Techo Collager
          </div>
        </div>
    </div>
  );
};

export default Canvas;