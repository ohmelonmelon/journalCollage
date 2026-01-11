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
      body {
        visibility: hidden;
      }
      #printable-canvas {
        visibility: visible !important;
        position: absolute;
        left: 0 !important;
        top: 0 !important;
        /* Reset any screen scaling to ensure 1:1 print size */
        transform: none !important;
        /* Ensure it takes its natural defined size (mm) and not the window size */
        width: auto !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden;
        box-shadow: none !important;
        background: white !important;
      }
      /* Hide guidelines or placeholders if needed */
      .no-print {
        display: none !important;
      }
      /* Ensure borders print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  styleEl.innerHTML = css;
};