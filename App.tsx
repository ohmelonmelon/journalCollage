import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_PRESET } from './constants';
import { PresetConfig, PhotoData } from './types';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ZoomToolbar from './components/ZoomToolbar';
import { injectPrintStyles } from './utils/printUtils';

const App: React.FC = () => {
  const [currentPreset, setCurrentPreset] = useState<PresetConfig>(DEFAULT_PRESET);
  const [photos, setPhotos] = useState<Map<string, PhotoData>>(new Map());
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

  // Handle Paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!selectedCellId) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            // We need to trigger the loading logic similar to file input
            // Create a temp object URL
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                // We need cell dimensions to auto-fit
                // Since we don't have direct access to DOM here, we can roughly calculate 
                // or just rely on the GridCell component to handle 'init' if we pass the file.
                // However, passing just the file to state and letting GridCell effect handle it is safer.
                
                // Let's defer the "fitting" logic to the component via a state update 
                // that passes the raw file.
                
                // Note: The GridCell needs to know it's a NEW file to recalibrate. 
                // We can just pass the file object.
                
                // We need to calculate the fit here because GridCell logic is inside GridCell.
                // But GridCell watches `photoData.imageUrl`. 
                // So updating state here is fine. 
                // The tricky part is 'No White Space' initial calculation needs rendered DOM size.
                // Solution: We'll pass the file to a helper or just let GridCell detect a change in file/url 
                // and run its internal logic.
                
                updatePhoto(selectedCellId, {
                    file,
                    imageUrl: url,
                    nativeWidth: img.naturalWidth,
                    nativeHeight: img.naturalHeight,
                    // Reset transform data so GridCell knows to re-calc
                    scale: 0, 
                    x: 0, 
                    y: 0 
                });
            };
            img.src = url;
          }
          break; // Only take first image
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedCellId]);


  const updatePhoto = (id: string, updates: Partial<PhotoData>) => {
    setPhotos(prev => {
      const newMap = new Map<string, PhotoData>(prev);
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
      
      // If scale is 0 (signal from paste/load), we expect the component 
      // to handle the actual calculation, but we need to store the raw data first.
      // Wait, GridCell calculates inside `loadImage`. 
      // If we paste, we are simulating a load.
      
      newMap.set(id, { ...existing, ...updates });
      return newMap;
    });
  };

  const handleClear = () => {
    if (window.confirm('确定要清空所有内容吗？')) {
      setPhotos(new Map());
      setSelectedCellId(null);
    }
  };

  const handlePrint = () => {
    // Deselect cell to hide handles
    setSelectedCellId(null);
    
    // Small timeout to allow state to settle/UI to update
    setTimeout(() => {
        window.print();
    }, 100);
  };

  // Get selected photo data for toolbar
  const selectedPhoto = selectedCellId ? photos.get(selectedCellId) : undefined;
  
  // Calculate selected cell dimensions in PX for the toolbar to use for "Reset" logic
  // (Approximate is fine for the toolbar logic)
  const cellDim = {
      width: currentPreset.cellWidthMm * 3.78, // Rough conversion for logic
      height: currentPreset.cellHeightMm * 3.78
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar 
        currentPreset={currentPreset}
        onPresetChange={(p) => {
            setCurrentPreset(p);
            setPhotos(new Map()); // Clear on preset change to avoid layout mismatch
            setSelectedCellId(null);
        }}
        photoCount={Array.from(photos.values()).filter((p: PhotoData) => p.imageUrl).length}
        onClear={handleClear}
        onPrint={handlePrint}
      />

      <main 
        className="flex-1 relative flex flex-col items-center justify-center bg-gray-100/50"
        onClick={() => setSelectedCellId(null)} // Deselect when clicking background
      >
        {/* Floating Zoom Toolbar */}
        {selectedCellId && selectedPhoto?.imageUrl && (
            <ZoomToolbar 
                photoData={selectedPhoto} 
                onUpdate={updatePhoto} 
                cellDimensions={cellDim}
            />
        )}

        {/* Scrollable Canvas Area */}
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