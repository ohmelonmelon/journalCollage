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
    <div 
        className="w-full h-full bg-white flex items-center justify-between px-6 animate-in fade-in slide-in-from-top-2 no-print"
        onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-6 w-full max-w-4xl mx-auto">
          {/* Left: Actions */}
          <div className="flex items-center gap-2 border-r border-gray-200 pr-6">
             <button 
                onClick={onReplace}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium transition-colors"
                title="粘贴新图片替换当前图片"
            >
                <ClipboardPaste size={16} />
                <span>替换图片</span>
            </button>
            <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 text-gray-600 rounded-md text-sm font-medium transition-colors"
                title="重置位置和大小"
            >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">重置</span>
            </button>
          </div>

          {/* Center: Zoom Controls */}
          <div className="flex-1 flex items-center gap-4">
             <button 
                onClick={() => handleZoomBtn('out')}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600 transition-colors"
             >
                <ZoomOut size={18} />
             </button>
             
             <div className="flex-1 flex items-center gap-3">
                 <input 
                    type="range"
                    min={minScale}
                    max={5}
                    step={0.01}
                    value={currentScale}
                    onChange={(e) => updateScale(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
             </div>

             <button 
                onClick={() => handleZoomBtn('in')}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600 transition-colors"
             >
                <ZoomIn size={18} />
             </button>
             
             <span className="text-sm font-mono font-medium text-gray-700 w-12 text-right">
                {percentage}%
             </span>
          </div>
      </div>
    </div>
  );
};

export default ZoomToolbar;