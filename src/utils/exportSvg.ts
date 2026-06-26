/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CipherSymbol, CipherSettings } from "../types";
import { getSpiralCoordinates } from "./cipher";

/**
 * Generates a clean, beautifully styled standalone SVG string representing the current state of the spiraling grid.
 */
export function exportGridToSvg(symbols: CipherSymbol[], settings: CipherSettings): string {
  const L = symbols.length;
  // Calculate grid size N (smallest odd square that fits all symbols)
  const N = L === 0 ? 3 : (() => {
    let size = Math.ceil(Math.sqrt(L));
    if (size % 2 === 0) size++; // make it odd
    return Math.max(3, size);
  })();

  const fullCoords = getSpiralCoordinates(N * N);
  if (fullCoords.length === 0) return "";

  const xs = fullCoords.map((c) => c.x);
  const ys = fullCoords.map((c) => c.y);
  const bounds = {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };

  const colsCount = bounds.maxX - bounds.minX + 1;
  const rowsCount = bounds.maxY - bounds.minY + 1;

  // Fixed optimal dimensions for highly legible SVG export
  const cellSize = 50;
  const padding = 20;
  const width = colsCount * cellSize + padding * 2;
  const height = rowsCount * cellSize + padding * 2;

  // Modern minimal colors matching our Tailwind system
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #ffffff; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <defs>
    <style>
      .placeholder-cell { fill: #fafafa; }
      .placeholder-text { fill: #a1a1aa; font-family: monospace; font-size: 11px; opacity: 0.4; text-anchor: middle; dominant-baseline: middle; }
      
      .active-cell-normal { fill: #f4f4f5; }
      .active-text-normal { fill: #000000; text-anchor: middle; dominant-baseline: middle; }
      
      .freq-bg-e { fill: #18181b; }
      .freq-text-e { fill: #ffffff; text-anchor: middle; dominant-baseline: middle; }
      
      .freq-bg-taoin { fill: #3f3f46; }
      .freq-text-taoin { fill: #ffffff; text-anchor: middle; dominant-baseline: middle; }
      
      .freq-bg-srhld { fill: #d4d4d8; }
      .freq-text-srhld { fill: #000000; text-anchor: middle; dominant-baseline: middle; }
      
      .freq-bg-ucumf { fill: #f4f4f5; }
      .freq-text-ucumf { fill: #000000; text-anchor: middle; dominant-baseline: middle; }
      
      .freq-bg-ywgpm { fill: #fafafa; }
      .freq-text-ywgpm { fill: #000000; text-anchor: middle; dominant-baseline: middle; }
      
      .freq-bg-rare { fill: #ffffff; stroke: #e4e4e7; stroke-width: 1; }
      .freq-text-rare { fill: #71717a; text-anchor: middle; dominant-baseline: middle; }
      
      .freq-bg-default { fill: #ffffff; stroke: #f4f4f5; stroke-width: 1; }
      .freq-text-default { fill: #a1a1aa; text-anchor: middle; dominant-baseline: middle; }

      .primary-text { font-family: monospace; font-size: 14px; font-weight: bold; }
      .secondary-text { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10px; opacity: 0.7; }
    </style>
  </defs>
  
  <!-- Outer smooth background canvas -->
  <rect width="100%" height="100%" fill="#ffffff" />
  
  <g transform="translate(${padding}, ${padding})">
`;

  for (let i = 0; i < fullCoords.length; i++) {
    const coord = fullCoords[i];
    const gridX = coord.x - bounds.minX;
    const gridY = coord.y - bounds.minY;
    
    const cellX = gridX * cellSize + 2;
    const cellY = gridY * cellSize + 2;
    const size = cellSize - 4;

    if (i < L) {
      // Active cipher cell
      const sym = symbols[i];
      let bgClass = "active-cell-normal";
      let textClass = "active-text-normal";

      if (settings.colorByFrequency) {
        const c = sym.originalChar.toUpperCase();
        if (c === "E") {
          bgClass = "freq-bg-e";
          textClass = "freq-text-e";
        } else if ("TAOIN".includes(c)) {
          bgClass = "freq-bg-taoin";
          textClass = "freq-text-taoin";
        } else if ("SRHLD".includes(c)) {
          bgClass = "freq-bg-srhld";
          textClass = "freq-text-srhld";
        } else if ("UCUMF".includes(c)) {
          bgClass = "freq-bg-ucumf";
          textClass = "freq-text-ucumf";
        } else if ("YWGPM".includes(c)) {
          bgClass = "freq-bg-ywgpm";
          textClass = "freq-text-ywgpm";
        } else if ("BVKXJQZ".includes(c)) {
          bgClass = "freq-bg-rare";
          textClass = "freq-text-rare";
        } else {
          bgClass = "freq-bg-default";
          textClass = "freq-text-default";
        }
      }

      svgContent += `    <rect x="${cellX}" y="${cellY}" width="${size}" height="${size}" rx="4" class="${bgClass}" />\n`;

      const cenX = cellX + size / 2;
      const cenY = cellY + size / 2;

      if (settings.boxDisplayMode === "number") {
        svgContent += `    <text x="${cenX}" y="${cenY}" class="${textClass} primary-text">${sym.encryptedValue}</text>\n`;
      } else if (settings.boxDisplayMode === "letter") {
        const dChar = sym.selectedDecryptedChar === " " ? "_" : sym.selectedDecryptedChar;
        svgContent += `    <text x="${cenX}" y="${cenY}" class="${textClass}" style="font-size: 14px; font-weight: bold;">${dChar}</text>\n`;
      } else {
        // "both"
        const dChar = sym.selectedDecryptedChar === " " ? "_" : sym.selectedDecryptedChar;
        svgContent += `    <text x="${cenX}" y="${cenY - 5}" class="${textClass} primary-text">${sym.encryptedValue}</text>\n`;
        svgContent += `    <text x="${cenX}" y="${cenY + 9}" class="${textClass} secondary-text">${dChar}</text>\n`;
      }
    }
  }

  svgContent += `  </g>\n</svg>`;
  return svgContent;
}

/**
 * Triggers a download of the provided SVG string.
 */
export function downloadSvg(svgString: string, filename = "hermes-grid.svg") {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
