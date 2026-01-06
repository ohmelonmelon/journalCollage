import React from 'react';
import { PhotoData } from '../types';
import { RotateCcw, ZoomIn, ZoomOut, ClipboardPaste } from 'lucide-react';

interface ZoomToolbarProps {
  photoData: PhotoData | undefined;
  onUpdate: (id: string, updates: Partial<PhotoData>) => void;
  cellDimensions: { width: number; height: number };
  onReplace: () => void;
}

const ZoomToolbar: React.FC<ZoomToolbarProps> = ({ photoData, onUpdate, cellDimensions, onReplace }) => {
  if (!photoData || !photoData.imageUrl) return null;

  const currentScale = photoData.scale;
  
  // Calculate percentage relative to "Fit" size (minScale)
  const minScale = Math.max(
    cellDimensions.width / photoData.nativeWidth,
    cellDimensions.height / photoData.nativeHeight
  );

  const percentage = Math.round((currentScale / minScale) * 100);

  const updateScale = (newScale: number) => {
    // Clamp logic
    if (newScale < minScale) newScale = minScale;
    if (newScale > 5) newScale = 5;

    // Recalculate position to keep centered-ish if possible, or just clamp
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
  }

  const handleZoomBtn = (direction: 'in' | 'out') => {
    const step = 0.1 * minScale;
    updateScale(direction === 'in' ? currentScale + step : currentScale - step);
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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-lg rounded-2xl px-4 py-3 flex flex-col gap-3 border border-gray-200 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-4 no-print min-w-[280px]">
      
      {/* Top Row: Buttons */}
      <div className="flex items-center justify-between w-full">
         <div className="flex items-center gap-2">
            <button 
                onClick={() => handleZoomBtn('out')}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                title="缩小"
            >
                <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono font-medium text-gray-700 select-none w-10 text-center">
                {percentage}%
            </span>
            <button 
                onClick={() => handleZoomBtn('in')}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                title="放大"
            >
                <ZoomIn size={16} />
            </button>
         </div>

         <div className="w-px h-4 bg-gray-200 mx-2" />

         <div className="flex items-center gap-2">
            <button 
                onClick={handleReset}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                title="重置位置和大小"
            >
                <RotateCcw size={16} />
            </button>
            <button 
                onClick={onReplace}
                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium transition-colors"
                title="粘贴新图片替换当前图片"
            >
                <ClipboardPaste size={14} />
                <span>替换</span>
            </button>
         </div>
      </div>

      {/* Bottom Row: Slider */}
      <div className="w-full px-1">
        <input 
            type="range"
            min={minScale}
            max={5}
            step={0.01}
            value={currentScale}
            onChange={(e) => updateScale(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
    </div>
  );
};

export default ZoomToolbar;