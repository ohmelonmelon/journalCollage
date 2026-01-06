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
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
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