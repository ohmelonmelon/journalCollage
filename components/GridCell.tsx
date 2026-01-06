import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PhotoData, PresetConfig } from '../types';
import { Image as ImageIcon, Upload, Clipboard } from 'lucide-react';

interface GridCellProps {
  id: string;
  photoData: PhotoData | undefined;
  preset: PresetConfig;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PhotoData>) => void;
}

const GridCell: React.FC<GridCellProps> = ({
  id,
  photoData,
  preset,
  isSelected,
  onSelect,
  onUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate pixel dimensions based on mm (approximate for screen, exact for print via CSS)
  const getRenderedDimensions = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }
    return { width: 0, height: 0 };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { width: cellW, height: cellH } = getRenderedDimensions();
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;

      // "No White Space" logic
      const scaleX = cellW / imgW;
      const scaleY = cellH / imgH;
      const initialScale = Math.max(scaleX, scaleY);

      // Center the image
      const renderedImgW = imgW * initialScale;
      const renderedImgH = imgH * initialScale;
      
      const x = (cellW - renderedImgW) / 2;
      const y = (cellH - renderedImgH) / 2;

      onUpdate(id, {
        file,
        imageUrl: url,
        nativeWidth: imgW,
        nativeHeight: imgH,
        scale: initialScale,
        x,
        y
      });
    };
    img.src = url;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    
    if (!photoData?.imageUrl) {
        return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - (photoData.x || 0), y: e.clientY - (photoData.y || 0) });
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Ensure cell is selected
    onSelect(id);
    fileInputRef.current?.click();
  };

  const handlePasteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            // Find image types
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
                const blob = await item.getType(imageType);
                const file = new File([blob], "pasted-image.png", { type: imageType });
                loadImage(file);
                return;
            }
        }
        alert("剪贴板中没有图片 (No image found in clipboard)");
    } catch (err) {
        console.error(err);
        alert("无法读取剪贴板，请尝试使用 Ctrl+V (Cannot read clipboard, try Ctrl+V)");
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isSelected || !photoData?.imageUrl) return;
    e.preventDefault();

    const { width: cellW, height: cellH } = getRenderedDimensions();
    const currentScale = photoData.scale;
    const imgW = photoData.nativeWidth;
    const imgH = photoData.nativeHeight;
    
    const zoomFactor = -e.deltaY * 0.001;
    let newScale = currentScale + zoomFactor;

    const minScale = Math.max(cellW / imgW, cellH / imgH);
    if (newScale < minScale) newScale = minScale;
    if (newScale > 5) newScale = 5;

    let newX = photoData.x;
    let newY = photoData.y;

    const minX = cellW - (imgW * newScale);
    const maxX = 0;
    const minY = cellH - (imgH * newScale);
    const maxY = 0;

    // Center zoom adjustment could be better, but clamping is essential
    if (newX > maxX) newX = maxX;
    if (newX < minX) newX = minX;
    if (newY > maxY) newY = maxY;
    if (newY < minY) newY = minY;

    onUpdate(id, { scale: newScale, x: newX, y: newY });
  }, [isSelected, photoData, id, onUpdate]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
        container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
        if (container) {
            container.removeEventListener('wheel', handleWheel);
        }
    };
  }, [handleWheel]);


  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !photoData) return;

      const { width: cellW, height: cellH } = getRenderedDimensions();
      const imgW = photoData.nativeWidth;
      const imgH = photoData.nativeHeight;
      const scale = photoData.scale;

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      const minX = cellW - (imgW * scale);
      const maxX = 0;
      const minY = cellH - (imgH * scale);
      const maxY = 0;

      if (newX < minX) newX = minX;
      if (newX > maxX) newX = maxX;
      if (newY < minY) newY = minY;
      if (newY > maxY) newY = maxY;

      onUpdate(id, { x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, photoData, id, onUpdate]);


  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-hidden cursor-pointer bg-white group select-none
        transition-shadow duration-200
        ${isSelected ? 'ring-2 ring-blue-500 z-10 shadow-lg' : 'hover:ring-1 hover:ring-blue-300'}
      `}
      style={{
        width: `${preset.cellWidthMm}mm`,
        height: `${preset.cellHeightMm}mm`,
        border: '0.2pt solid #D3D3D3' 
      }}
      onMouseDown={handleMouseDown}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {photoData?.imageUrl ? (
        <img
          src={photoData.imageUrl}
          alt="Cell content"
          draggable={false}
          className="absolute max-w-none origin-top-left touch-none"
          style={{
            transform: `translate(${photoData.x}px, ${photoData.y}px)`,
            width: `${photoData.nativeWidth * photoData.scale}px`,
            height: `${photoData.nativeHeight * photoData.scale}px`,
          }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 transition-colors gap-2">
            <div className="flex gap-2">
                 {/* Swap order: Paste is primary default */}
                 <button 
                    onClick={handlePasteClick}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100"
                    title="粘贴图片"
                 >
                    <Clipboard className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold">粘贴</span>
                 </button>
                 
                 <div className="w-px h-8 bg-gray-100 my-auto"></div>

                 <button 
                    onClick={handleUploadClick}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                    title="上传图片"
                 >
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">上传</span>
                 </button>
            </div>
            <span className="text-[9px] opacity-40 uppercase tracking-wider font-mono">Select & Ctrl+V</span>
        </div>
      )}
      
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none no-print" />
      )}
    </div>
  );
};

export default GridCell;