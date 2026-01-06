import React from 'react';
import { PhotoData } from '../types';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomToolbarProps {
  photoData: PhotoData | undefined;
  onUpdate: (id: string, updates: Partial<PhotoData>) => void;
  cellDimensions: { width: number; height: number };
}

const ZoomToolbar: React.FC<ZoomToolbarProps> = ({ photoData, onUpdate, cellDimensions }) => {
  if (!photoData || !photoData.imageUrl) return null;

  const currentScale = photoData.scale;
  
  // Calculate percentage relative to "Fit" size (minScale)
  const minScale = Math.max(
    cellDimensions.width / photoData.nativeWidth,
    cellDimensions.height / photoData.nativeHeight
  );

  const percentage = Math.round((currentScale / minScale) * 100);

  const handleZoom = (direction: 'in' | 'out') => {
    const step = 0.1 * minScale;
    let newScale = direction === 'in' ? currentScale + step : currentScale - step;
    
    // Clamp logic (duplicated from GridCell logic mostly)
    if (newScale < minScale) newScale = minScale;
    if (newScale > 5) newScale = 5;

    // Recalculate position to keep centered-ish if possible, or just clamp
    // For simplicity here, we keep the center point relative to the viewport stationary
    // But basic clamping is safer to prevent bugs
    const imgW = photoData.nativeWidth;
    const imgH = photoData.nativeHeight;
    const cellW = cellDimensions.width;
    const cellH = cellDimensions.height;

    let newX = photoData.x;
    let newY = photoData.y;
    
    // Naive re-clamp
    const minX = cellW - (imgW * newScale);
    const minY = cellH - (imgH * newScale);
    
    if (newX < minX) newX = minX;
    if (newX > 0) newX = 0;
    if (newY < minY) newY = minY;
    if (newY > 0) newY = 0;

    onUpdate(photoData.id, { scale: newScale, x: newX, y: newY });
  };

  const handleReset = () => {
    // Reset to minScale, centered
    const imgW = photoData.nativeWidth;
    const imgH = photoData.nativeHeight;
    const cellW = cellDimensions.width;
    const cellH = cellDimensions.height;
    
    const newScale = minScale;
    const newX = (cellW - imgW * newScale) / 2;
    const newY = (cellH - imgH * newScale) / 2;

    onUpdate(photoData.id, { scale: newScale, x: newX, y: newY });
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-md rounded-full px-4 py-2 flex items-center gap-4 border border-gray-200 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-4 no-print">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => handleZoom('out')}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          title="缩小"
        >
          <ZoomOut size={16} />
        </button>
        
        <span className="text-xs font-mono w-12 text-center text-gray-700 select-none">
            {percentage}%
        </span>

        <button 
          onClick={() => handleZoom('in')}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          title="放大"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="w-px h-4 bg-gray-300" />

      <button 
        onClick={handleReset}
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors font-medium px-1"
      >
        <RotateCcw size={12} />
        <span>重置</span>
      </button>
    </div>
  );
};

export default ZoomToolbar;