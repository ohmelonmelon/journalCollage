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

  // Use clientWidth/Height for local coordinates. 
  // getBoundingClientRect() is affected by parent transforms (zoom), which breaks internal offset calculations.
  const getLocalDimensions = () => {
    if (containerRef.current) {
      return { 
          width: containerRef.current.clientWidth, 
          height: containerRef.current.clientHeight 
      };
    }
    return { width: 0, height: 0 };
  };

  const calculateFit = (imgW: number, imgH: number) => {
      const { width: cellW, height: cellH } = getLocalDimensions();
      if (cellW === 0 || cellH === 0) return null;

      // "No White Space" / Cover logic
      const scaleX = cellW / imgW;
      const scaleY = cellH / imgH;
      // We must be at least this large to cover the hole
      const initialScale = Math.max(scaleX, scaleY);

      // Center the image
      const renderedImgW = imgW * initialScale;
      const renderedImgH = imgH * initialScale;
      
      const x = (cellW - renderedImgW) / 2;
      const y = (cellH - renderedImgH) / 2;

      return { scale: initialScale, x, y };
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
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;

      const fit = calculateFit(imgW, imgH);
      
      // If we can't calculate fit yet (e.g. not mounted), default to 0 and let effect handle it
      // But typically loadImage happens after mount.
      
      const updates: Partial<PhotoData> = {
        file,
        imageUrl: url,
        nativeWidth: imgW,
        nativeHeight: imgH,
      };

      if (fit) {
          updates.scale = fit.scale;
          updates.x = fit.x;
          updates.y = fit.y;
      } else {
          updates.scale = 0; // Trigger effect later
      }

      onUpdate(id, updates);
    };
    img.src = url;
  };

  // Handle external initialization (e.g. Paste where scale is set to 0 initially)
  useEffect(() => {
      if (photoData?.imageUrl && photoData.nativeWidth && photoData.scale === 0) {
          const fit = calculateFit(photoData.nativeWidth, photoData.nativeHeight);
          if (fit) {
              onUpdate(id, { scale: fit.scale, x: fit.x, y: fit.y });
          }
      }
  }, [photoData, id, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    
    if (!photoData?.imageUrl) {
        return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - (photoData.x || 0), y: e.clientY - (photoData.y || 0) });
  };
  
  const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    fileInputRef.current?.click();
  };

  const handlePasteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
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

    const { width: cellW, height: cellH } = getLocalDimensions();
    const currentScale = photoData.scale;
    const imgW = photoData.nativeWidth;
    const imgH = photoData.nativeHeight;
    
    const zoomFactor = -e.deltaY * 0.001;
    let newScale = currentScale + zoomFactor;

    // Minimum scale is strictly the cover scale
    const minScale = Math.max(cellW / imgW, cellH / imgH);
    if (newScale < minScale) newScale = minScale;
    // Cap max scale
    if (newScale > 5) newScale = 5;

    // Recalculate clamps based on new scale
    let newX = photoData.x;
    let newY = photoData.y;

    // Clamp Boundaries:
    // Left edge (x) cannot be > 0 (otherwise left whitespace)
    // Right edge (x + w) cannot be < cellW (otherwise right whitespace) -> x cannot be < cellW - w
    const minX = cellW - (imgW * newScale);
    const maxX = 0;
    const minY = cellH - (imgH * newScale);
    const maxY = 0;

    // Apply clamp
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

      const { width: cellW, height: cellH } = getLocalDimensions();
      const imgW = photoData.nativeWidth;
      const imgH = photoData.nativeHeight;
      const scale = photoData.scale;

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      const minX = cellW - (imgW * scale);
      const maxX = 0;
      const minY = cellH - (imgH * scale);
      const maxY = 0;

      // Soft constraints or hard constraints? Hard for "No White Space"
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
      onClick={handleClick}
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