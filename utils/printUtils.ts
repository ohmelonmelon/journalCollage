import { PresetConfig } from '../types';

export const injectPrintStyles = (preset: PresetConfig) => {
  const styleId = 'dynamic-print-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  // Inject @page rule based on current preset dimensions
  // margin: 0 is important to let our CSS control the exact layout
  const css = `
    @page {
      size: ${preset.paperWidthMm}mm ${preset.paperHeightMm}mm;
      margin: 0;
    }
    @media print {
      html, body {
        width: ${preset.paperWidthMm}mm;
        height: ${preset.paperHeightMm}mm;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      
      body * {
        visibility: hidden;
      }
      
      #printable-canvas, #printable-canvas * {
        visibility: visible;
      }
      
      #printable-canvas {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        /* Force exact dimensions matching the paper size, overrides any 'auto' inference */
        width: ${preset.paperWidthMm}mm !important;
        height: ${preset.paperHeightMm}mm !important;
        /* Reset any screen scaling to ensure 1:1 print size */
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
        /* Ensure background is white and no shadows */
        box-shadow: none !important;
        background: white !important;
        z-index: 9999;
        overflow: hidden;
      }
      
      /* Hide guidelines or placeholders if needed */
      .no-print {
        display: none !important;
      }
      
      /* Ensure borders and graphics print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  styleEl.innerHTML = css;
};