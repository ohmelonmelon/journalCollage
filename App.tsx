import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_PRESET } from './constants';
import { PresetConfig, PhotoData } from './types';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ZoomToolbar from './components/ZoomToolbar';
import { injectPrintStyles } from './utils/printUtils';
import { useHistory } from './hooks/useHistory';

const App: React.FC = () => {
  const [currentPreset, setCurrentPreset] = useState<PresetConfig>(DEFAULT_PRESET);
  
  // Use history hook for photos state
  const {
    state: photos,
    undo,
    redo,
    canUndo,
    canRedo,
    pushState: setPhotos
  } = useHistory<Map<string, PhotoData>>(new Map());

  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [viewportScale, setViewportScale] = useState(1);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Print Styles
  useEffect(() => {
    injectPrintStyles(currentPreset);
  }, [currentPreset]);

  // Handle Resize to fit canvas
  const handleResize = useCallback(() => {
    if (canvasContainerRef.current) {
      const containerW = canvasContainerRef.current.clientWidth - 80; // Padding
      const containerH = canvasContainerRef.current.clientHeight - 80;
      
      // Convert mm to px approx (1mm ~ 3.78px) to guess required scale
      const mmToPx = 3.78;
      const paperW = currentPreset.paperWidthMm * mmToPx;
      const paperH = currentPreset.paperHeightMm * mmToPx;

      const scaleW = containerW / paperW;
      const scaleH = containerH / paperH;
      
      // Use the smaller scale to fit, max 1.2 to avoid getting too huge on big screens
      setViewportScale(Math.min(Math.min(scaleW, scaleH), 1.2));
    }
  }, [currentPreset]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Handle Paste (Global and Replace)
  const processPaste = useCallback(async (clipboardItems: DataTransferItemList, targetCellId: string) => {
      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.indexOf('image') !== -1) {
          const file = clipboardItems[i].getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                // Update photo with new file - this works for both empty and existing cells (Replace)
                // We create a new Map to push to history
                const newMap = new Map(photos);
                const existing = newMap.get(targetCellId) || {
                    id: targetCellId,
                    file: null,
                    imageUrl: null,
                    x: 0, 
                    y: 0,
                    scale: 1,
                    nativeWidth: 0,
                    nativeHeight: 0
                };

                newMap.set(targetCellId, {
                    ...existing,
                    file,
                    imageUrl: url,
                    nativeWidth: img.naturalWidth,
                    nativeHeight: img.naturalHeight,
                    scale: 0, // Reset scale to trigger auto-fit logic in GridCell/Update
                    x: 0,
                    y: 0
                });
                
                setPhotos(newMap);
            };
            img.src = url;
          }
          break; // Only take first image
        }
      }
  }, [photos, setPhotos]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!selectedCellId) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      await processPaste(items, selectedCellId);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedCellId, processPaste]);

  // Helper for manual paste button in toolbar
  const handleManualPaste = async (targetId: string) => {
      try {
          // Check permission or try reading directly
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
               // We need to convert ClipboardItem to DataTransfer-like interface or handle Blob directly
               // navigator.clipboard.read() returns Blob types.
               const imageType = item.types.find(type => type.startsWith('image/'));
               if (imageType) {
                   const blob = await item.getType(imageType);
                   const file = new File([blob], "pasted-image", { type: imageType });
                   
                   // Re-use image loading logic
                    const url = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => {
                        const newMap = new Map(photos);
                        const existing = newMap.get(targetId) || { id: targetId } as PhotoData; // partial cast for simplicity
                        newMap.set(targetId, {
                            ...existing,
                            id: targetId,
                            file,
                            imageUrl: url,
                            nativeWidth: img.naturalWidth,
                            nativeHeight: img.naturalHeight,
                            scale: 0,
                            x: 0, 
                            y: 0
                        } as PhotoData);
                        setPhotos(newMap);
                    };
                    img.src = url;
                   return;
               }
          }
          alert("剪贴板中没有图片 / No image in clipboard");
      } catch (e) {
          console.error(e);
          alert("无法访问剪贴板，请确保已授权或使用 Ctrl+V / Cannot access clipboard, try Ctrl+V");
      }
  };


  const updatePhoto = (id: string, updates: Partial<PhotoData>) => {
      // Create a new history entry
      const newMap = new Map(photos);
      const existing: PhotoData = newMap.get(id) || {
        id,
        file: null,
        imageUrl: null,
        x: 0,
        y: 0,
        scale: 1,
        nativeWidth: 0,
        nativeHeight: 0
      };
      
      // Optimization: If dragging (frequent updates), usually we might want to debounce history push
      // But for simplicity in this requested task, we push state. 
      // To prevent history spamming during drag, 'GridCell' updates could be local state 
      // and 'onUpdate' (this function) only called on mouseUp.
      // However, the current architecture calls onUpdate during drag. 
      // For a robust undo/redo, we should assume the user might want to undo a specific move.
      // If performance is an issue, we can debounce, but for now strict state management:
      
      newMap.set(id, { ...existing, ...updates });
      setPhotos(newMap);
  };

  const handleClear = () => {
    if (window.confirm('确定要清空所有内容吗？')) {
      setPhotos(new Map());
      setSelectedCellId(null);
    }
  };

  const handlePrint = () => {
    setSelectedCellId(null);
    setTimeout(() => {
        window.print();
    }, 100);
  };

  const selectedPhoto = selectedCellId ? photos.get(selectedCellId) : undefined;
  
  const cellDim = {
      width: currentPreset.cellWidthMm * 3.78,
      height: currentPreset.cellHeightMm * 3.78
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar 
        currentPreset={currentPreset}
        onPresetChange={(p) => {
            setCurrentPreset(p);
            setPhotos(new Map());
            setSelectedCellId(null);
        }}
        photoCount={Array.from(photos.values()).filter((p: PhotoData) => p.imageUrl).length}
        onClear={handleClear}
        onPrint={handlePrint}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <main 
        className="flex-1 relative flex flex-col items-center justify-center bg-gray-100/50"
        onClick={() => setSelectedCellId(null)}
      >
        {selectedCellId && selectedPhoto?.imageUrl && (
            <ZoomToolbar 
                photoData={selectedPhoto} 
                onUpdate={updatePhoto} 
                cellDimensions={cellDim}
                onReplace={() => handleManualPaste(selectedCellId)}
            />
        )}

        <div 
            ref={canvasContainerRef}
            className="w-full h-full overflow-auto flex items-center justify-center p-10 custom-scrollbar"
        >
          <Canvas 
            preset={currentPreset}
            photos={photos}
            selectedCellId={selectedCellId}
            onSelectCell={setSelectedCellId}
            onUpdatePhoto={updatePhoto}
            scale={viewportScale}
          />
        </div>
      </main>
    </div>
  );
};

export default App;