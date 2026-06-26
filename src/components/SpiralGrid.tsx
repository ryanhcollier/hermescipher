/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CipherSymbol, CipherSettings } from "../types";
import { getSpiralCoordinates, getFrequencyColor } from "../utils/cipher";
import { RotateCw } from "lucide-react";

interface SpiralGridProps {
  symbols: CipherSymbol[];
  visibleCount: number;
  settings: CipherSettings;
  hoveredLetter: string | null;
  onHoverLetter: (letter: string | null) => void;
  selectedLetter: string | null;
  onToggleCandidate: (charIndex: number) => void;
  hoveredCellIndex: number | null;
  onHoverCellIndex: (index: number | null) => void;
  scannedIndices: number[];
  isPlaying: boolean;
}

export default function SpiralGrid({
  symbols,
  visibleCount,
  settings,
  hoveredLetter,
  onHoverLetter,
  selectedLetter,
  onToggleCandidate,
  hoveredCellIndex,
  onHoverCellIndex,
  scannedIndices,
  isPlaying,
}: SpiralGridProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 600 });

  // Use ResizeObserver to measure available width and height of parent wrapper
  useEffect(() => {
    if (!outerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: width || 340,
        height: height || 600,
      });
    });

    resizeObserver.observe(outerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const L = symbols.length;
  // Calculate grid size N (smallest odd square that fits all symbols)
  const N = useMemo(() => {
    if (L === 0) return 3;
    let size = Math.ceil(Math.sqrt(L));
    if (size % 2 === 0) size++; // make it odd
    return Math.max(3, size);
  }, [L]);

  // Generate full N*N spiral coordinates
  const fullCoords = useMemo(() => {
    return getSpiralCoordinates(N * N);
  }, [N]);

  // Find min/max for bounds layout mapping
  const bounds = useMemo(() => {
    if (fullCoords.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const xs = fullCoords.map((c) => c.x);
    const ys = fullCoords.map((c) => c.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }, [fullCoords]);

  const colsCount = bounds.maxX - bounds.minX + 1;
  const rowsCount = bounds.maxY - bounds.minY + 1;

  // Dynamically calculate cell size so everything fits nicely inside the measured container dimensions
  const cellSize = useMemo(() => {
    if (colsCount === 0 || rowsCount === 0) return 30;

    // We leave a tiny bit of buffer padding (e.g. 24px)
    const padding = 24;
    const maxGridWidth = Math.max(100, dimensions.width - padding);
    const maxGridHeight = Math.max(100, dimensions.height - padding);

    // Max cell size based on width constraints
    const maxByWidth = maxGridWidth / colsCount;
    // Max cell size based on height constraints
    const maxByHeight = maxGridHeight / rowsCount;

    // The cell size should be the smaller of the two to prevent clipping in both dimensions
    const computedSize = Math.min(maxByWidth, maxByHeight);

    // Clamp the cell size between a minimum of 10px (so it NEVER overflows or clips!)
    // and a maximum of 56px to maintain great visual aesthetic on short streams.
    return Math.max(10, Math.min(56, computedSize));
  }, [colsCount, rowsCount, dimensions]);

  // Map each coord index to either an active symbol or a placeholder
  const gridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < fullCoords.length; i++) {
      const coord = fullCoords[i];
      const gridX = coord.x - bounds.minX;
      const gridY = coord.y - bounds.minY;

      if (i < L) {
        // Active symbol cell
        const sym = symbols[i];
        const isActive = i < visibleCount;
        cells.push({
          isPlaceholder: false,
          active: isActive,
          spiralIndex: i,
          symbol: sym,
          gridX,
          gridY,
        });
      } else {
        // Decorative placeholder cell
        const placeholderVal = String((i * 17) % 100).padStart(2, "0");
        cells.push({
          isPlaceholder: true,
          active: false,
          spiralIndex: i,
          symbolValue: placeholderVal,
          gridX,
          gridY,
        });
      }
    }
    return cells;
  }, [fullCoords, L, symbols, visibleCount, bounds]);

  // Generate SVG path for the active spiral line
  const svgPathD = useMemo(() => {
    if (visibleCount <= 1 || !settings.showSpiralLine) return "";
    let path = "";
    for (let i = 0; i < Math.min(visibleCount, L); i++) {
      const coord = fullCoords[i];
      if (!coord) continue;
      const gridX = coord.x - bounds.minX;
      const gridY = coord.y - bounds.minY;
      const cX = (gridX + 0.5) * cellSize;
      const cY = (gridY + 0.5) * cellSize;

      if (i === 0) {
        path += `M ${cX} ${cY}`;
      } else {
        path += ` L ${cX} ${cY}`;
      }
    }
    return path;
  }, [fullCoords, visibleCount, L, bounds, cellSize, settings.showSpiralLine]);

  return (
    <div 
      ref={outerRef}
      className="flex flex-col items-center justify-center relative overflow-hidden w-full h-full min-h-0"
    >
      {/* Grid Canvas Wrapper */}
      <div
        className="relative select-none z-10"
        style={{
          width: `${colsCount * cellSize}px`,
          height: `${rowsCount * cellSize}px`,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* SVG Spiral Path Underlying Grid */}
        {settings.showSpiralLine && svgPathD && (
          <svg
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <motion.path
              d={svgPathD}
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={Math.max(1, cellSize * 0.05)}
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
        )}

        {/* Cells Layout */}
        <div className="absolute inset-0 z-10">
          {gridCells.map((cell) => {
            const cellX = cell.gridX * cellSize;
            const cellY = cell.gridY * cellSize;

            if (cell.isPlaceholder) {
              return null;
            }

            const sym = cell.symbol!;
            const isHovered =
              hoveredCellIndex === cell.spiralIndex ||
              (!isPlaying && hoveredLetter !== null && sym.originalChar.toUpperCase() === hoveredLetter) ||
              (!isPlaying && selectedLetter !== null && sym.originalChar.toUpperCase() === selectedLetter);

            const isDoubleCandidate = sym.decryptedCandidates.length > 1;

            // Check if this cell is actively scanned or revealed:
            const isScanned = isPlaying
              ? (scannedIndices.includes(cell.spiralIndex) || hoveredCellIndex === cell.spiralIndex)
              : true;

            // Style of the cell block based on its state
            let cellStyleClass = "";
            const animType = cell.spiralIndex % 3; // 0: outlined, 1: numbers/text only, 2: solid white fills

            if (settings.colorByFrequency) {
              cellStyleClass = getFrequencyColor(sym.originalChar);
            } else if (isHovered || (isPlaying && isScanned)) {
              if (animType === 0) {
                // Outlined square
                cellStyleClass = "bg-transparent text-white border border-white/80 font-bold shadow-[0_0_8px_rgba(255,255,255,0.2)]";
              } else if (animType === 1) {
                // Numbers/letters only
                cellStyleClass = "bg-transparent text-white border border-transparent font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]";
              } else {
                // Solid white fill
                cellStyleClass = "bg-white text-black border border-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.4)]";
              }
            } else {
              cellStyleClass = "bg-zinc-950 text-zinc-400 border border-zinc-850 hover:border-zinc-500";
            }

            return (
              <div
                key={`active-${sym.id}`}
                className="absolute transition-all duration-200"
                style={{
                  left: `${cellX + 2}px`,
                  top: `${cellY + 2}px`,
                  width: `${cellSize - 4}px`,
                  height: `${cellSize - 4}px`,
                }}
                onMouseEnter={() => {
                  onHoverCellIndex(sym.spiralIndex);
                  onHoverLetter(sym.originalChar);
                }}
                onMouseLeave={() => {
                  onHoverCellIndex(null);
                  onHoverLetter(null);
                }}
              >
                <AnimatePresence>
                  <motion.div
                    id={`cell-${sym.spiralIndex}`}
                    initial={{ scale: 0, rotate: -45, opacity: 0 }}
                    animate={{
                      scale: 1,
                      rotate: 0,
                      opacity: 1,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className={`w-full h-full rounded flex flex-col items-center justify-center relative cursor-pointer select-none overflow-hidden transition-colors duration-200 ${cellStyleClass} ${
                      isHovered ? "z-30 shadow-[0_0_8px_rgba(255,255,255,0.15)]" : "z-20"
                    }`}
                  >
                    {/* Display content based on display mode / scanned state */}
                    {isPlaying && !isScanned ? (
                      <span 
                        className="font-mono text-zinc-800 animate-pulse select-none leading-none flex items-center justify-center"
                        style={{ fontSize: `${cellSize * 0.3}px` }}
                      >
                        ·
                      </span>
                    ) : (
                      <>
                        {settings.boxDisplayMode === "number" && (
                          <span 
                            className="font-mono font-bold leading-none select-none flex items-center justify-center"
                            style={{ fontSize: `${cellSize * 0.35}px` }}
                          >
                            {sym.encryptedValue}
                          </span>
                        )}

                        {settings.boxDisplayMode === "letter" && (
                          <span 
                            className="font-sans font-bold leading-none select-none flex items-center justify-center"
                            style={{ fontSize: `${cellSize * 0.35}px` }}
                          >
                            {sym.selectedDecryptedChar === " " ? "_" : sym.selectedDecryptedChar}
                          </span>
                        )}

                        {settings.boxDisplayMode === "both" && (
                          <div className="flex flex-col items-center justify-center">
                            <span 
                              className="font-mono font-bold leading-none select-none"
                              style={{ fontSize: `${cellSize * 0.26}px` }}
                            >
                              {sym.encryptedValue}
                            </span>
                            <span 
                              className={`font-sans leading-none select-none mt-0.5 ${
                                isHovered || (isPlaying && isScanned)
                                  ? (animType === 2 ? "text-black/60" : "text-white/60")
                                  : "text-zinc-500"
                              }`}
                              style={{ fontSize: `${cellSize * 0.20}px` }}
                            >
                              {sym.selectedDecryptedChar === " " ? "_" : sym.selectedDecryptedChar}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Double candidate indicator */}
                    {isDoubleCandidate && isScanned && cellSize >= 20 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCandidate(sym.charIndex);
                        }}
                        className={`absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center transition-colors cursor-pointer z-40 ${
                          isHovered || (isPlaying && isScanned)
                            ? "bg-black text-white hover:bg-zinc-800"
                            : "bg-white text-black hover:bg-zinc-100 border border-black"
                        }`}
                        style={{
                          width: `${Math.max(10, cellSize * 0.3)}px`,
                          height: `${Math.max(10, cellSize * 0.3)}px`,
                        }}
                        title="Ambiguous symbol. Click to toggle."
                      >
                        <RotateCw 
                          style={{
                            width: `${Math.max(7, cellSize * 0.2)}px`,
                            height: `${Math.max(7, cellSize * 0.2)}px`,
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
