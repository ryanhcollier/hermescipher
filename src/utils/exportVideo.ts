/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CipherSymbol, CipherSettings } from "../types";
import { getSpiralCoordinates } from "./cipher";

/**
 * Generates a beautiful 5-second looping 9:16 video of the auto-scan in action.
 */
export async function exportGridToVideo(
  symbols: CipherSymbol[],
  settings: CipherSettings,
  onProgress: (progress: number) => void
): Promise<void> {
  const L = symbols.length;
  if (L === 0) {
    alert("Please enter some text to generate a grid before exporting a video.");
    return;
  }

  // Calculate coordinates for the active symbols
  const N = (() => {
    let size = Math.ceil(Math.sqrt(L));
    if (size % 2 === 0) size++;
    return Math.max(3, size);
  })();

  const fullCoords = getSpiralCoordinates(N * N).slice(0, L);
  if (fullCoords.length === 0) return;

  const xs = fullCoords.map((c) => c.x);
  const ys = fullCoords.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const colsCount = maxX - minX + 1;
  const rowsCount = maxY - minY + 1;

  // Setup offscreen canvas with 9:16 vertical resolution
  const canvasWidth = 720;
  const canvasHeight = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create 2D canvas context");
  }

  // Calculate cell positioning to center the grid on the 9:16 frame
  const maxGridWidth = 620;
  const maxGridHeight = 620;
  const cellSize = Math.min(85, maxGridWidth / colsCount, maxGridHeight / rowsCount);

  const gridW = colsCount * cellSize;
  const gridH = rowsCount * cellSize;
  const offsetX = (canvasWidth - gridW) / 2;
  const offsetY = (canvasHeight - gridH) / 2;

  // Setup stream and MediaRecorder
  const fps = 30;
  const totalFrames = 300; // 10 seconds @ 30 FPS
  const stream = canvas.captureStream(fps);
  const chunks: Blob[] = [];

  // Find supported MIME Type, prioritizing MP4 formats
  let options = { mimeType: "video/mp4;codecs=h264" };
  if (typeof MediaRecorder !== "undefined") {
    const candidates = [
      "video/mp4;codecs=h264",
      "video/mp4;codecs=avc1",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm"
    ];
    let found = false;
    for (const cand of candidates) {
      if (MediaRecorder.isTypeSupported(cand)) {
        options = { mimeType: cand };
        found = true;
        break;
      }
    }
    if (!found) {
      options = { mimeType: "" }; // Browser default
    }
  }

  const recorder = new MediaRecorder(stream, options);
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise<void>((resolve, reject) => {
    recorder.onstop = () => {
      try {
        const fileExt = "mp4";
        const blob = new Blob(chunks, { type: options.mimeType || "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hermes-autoscan-loop-${Date.now()}.${fileExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    recorder.start();

    // Start drawing and recording frame by frame
    let frame = 0;
    let scannedSet: number[] = [];

    function drawFrame() {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      // Generate scanned indices subset every 15 frames (0.5 seconds at 30 FPS)
      if (frame % 15 === 0 || frame === 0) {
        if (L > 0) {
          // Pick a random fraction of active cells, min 2, max 18
          const baseCount = Math.max(2, Math.min(Math.floor(L * 0.15), 18));
          const countToPick = Math.max(1, Math.floor(baseCount * (0.8 + Math.random() * 0.4)));
          const indices = Array.from({ length: L }, (_, i) => i);
          const shuffled = [...indices].sort(() => 0.5 - Math.random());
          scannedSet = shuffled.slice(0, countToPick);
        } else {
          scannedSet = [];
        }
      }

      // Clear canvas with deep space black (matching dark theme)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw each cell as a beautiful rounded box in the centering layout
      for (let i = 0; i < L; i++) {
        const isScanned = scannedSet.includes(i);
        if (!isScanned) {
          continue;
        }

        const sym = symbols[i];
        const coord = fullCoords[i];
        const gridX = coord.x - minX;
        const gridY = coord.y - minY;
        const cellX = offsetX + gridX * cellSize + 3;
        const cellY = offsetY + gridY * cellSize + 3;
        const size = cellSize - 6;
        const cenX = cellX + size / 2;
        const cenY = cellY + size / 2;

        // Calculate background, border and text colors
        let bgStyle = "#ffffff";
        let textStyle = "#000000";
        let strokeStyle = "#ffffff";
        let drawBg = true;
        let drawBorder = true;
        let shadowColor = "rgba(255, 255, 255, 0.4)";
        let shadowBlur = 12;

        const animType = i % 3; // 0: outlined, 1: numbers/text only, 2: solid white fills

        if (settings.colorByFrequency) {
          const c = sym.originalChar.toUpperCase();
          if (c === "E") {
            bgStyle = "#ffffff";
            textStyle = "#000000";
            strokeStyle = "#ffffff";
          } else if ("TAOIN".includes(c)) {
            bgStyle = "#f4f4f5";
            textStyle = "#000000";
            strokeStyle = "#f4f4f5";
          } else if ("SRHLD".includes(c)) {
            bgStyle = "#d4d4d8";
            textStyle = "#000000";
            strokeStyle = "#d4d4d8";
          } else if ("UCUMF".includes(c)) {
            bgStyle = "#a1a1aa";
            textStyle = "#000000";
            strokeStyle = "#a1a1aa";
          } else if ("YWGPM".includes(c)) {
            bgStyle = "#71717a";
            textStyle = "#ffffff";
            strokeStyle = "#71717a";
          } else if ("BVKXJQZ".includes(c)) {
            bgStyle = "#27272a";
            textStyle = "#a1a1aa";
            strokeStyle = "#27272a";
          } else {
            bgStyle = "#18181b";
            textStyle = "#71717a";
            strokeStyle = "#18181b";
          }
        } else {
          // If we are not doing colorByFrequency, apply three simultaneous styles
          if (animType === 0) {
            // Outlined square
            bgStyle = "transparent";
            textStyle = "#ffffff";
            strokeStyle = "rgba(255, 255, 255, 0.8)";
            drawBg = false;
            drawBorder = true;
            shadowColor = "rgba(255, 255, 255, 0.2)";
            shadowBlur = 8;
          } else if (animType === 1) {
            // Numbers only
            bgStyle = "transparent";
            textStyle = "#ffffff";
            strokeStyle = "transparent";
            drawBg = false;
            drawBorder = false;
            shadowColor = "rgba(255, 255, 255, 0.8)";
            shadowBlur = 10;
          } else {
            // Solid white fill
            bgStyle = "#ffffff";
            textStyle = "#000000";
            strokeStyle = "#ffffff";
            drawBg = true;
            drawBorder = true;
            shadowColor = "rgba(255, 255, 255, 0.4)";
            shadowBlur = 12;
          }
        }

        // Draw cell background rounded rect with a glowing drop shadow
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;

        if (drawBg && bgStyle !== "transparent") {
          ctx.fillStyle = bgStyle;
          ctx.beginPath();
          ctx.roundRect(cellX, cellY, size, size, 5);
          ctx.fill();
        }

        // Reset shadow for stroke & text
        ctx.shadowBlur = 0;
        
        if (drawBorder && strokeStyle !== "transparent") {
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(cellX, cellY, size, size, 5);
          ctx.stroke();
        }

        // Draw cell labels
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (settings.boxDisplayMode === "number") {
          ctx.fillStyle = textStyle;
          ctx.font = `bold ${cellSize * 0.28}px monospace`;
          ctx.fillText(sym.encryptedValue, cenX, cenY);
        } else if (settings.boxDisplayMode === "letter") {
          ctx.fillStyle = textStyle;
          ctx.font = `bold ${cellSize * 0.28}px sans-serif`;
          const dChar = sym.selectedDecryptedChar === " " ? "_" : sym.selectedDecryptedChar;
          ctx.fillText(dChar, cenX, cenY);
        } else {
          // both
          const dChar = sym.selectedDecryptedChar === " " ? "_" : sym.selectedDecryptedChar;
          
          ctx.fillStyle = textStyle;
          ctx.font = `bold ${cellSize * 0.24}px monospace`;
          ctx.fillText(sym.encryptedValue, cenX, cenY - cellSize * 0.08);

          ctx.fillStyle = textStyle === "#ffffff" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)";
          ctx.font = `bold ${cellSize * 0.18}px sans-serif`;
          ctx.fillText(dChar, cenX, cenY + cellSize * 0.16);
        }
      }

      // Update progress notification
      frame++;
      onProgress(Math.floor((frame / totalFrames) * 100));

      // Schedule next frame in standard frame-rate timing (33.3ms for 30 FPS)
      setTimeout(drawFrame, 1000 / fps);
    }

    // Launch initial frame
    drawFrame();
  });
}
