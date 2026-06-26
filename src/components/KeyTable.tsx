/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SYMBOL_POOLS } from "../utils/cipher";
import { Search, Eye } from "lucide-react";

interface KeyTableProps {
  hoveredLetter: string | null;
  onHoverLetter: (letter: string | null) => void;
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
}

export default function KeyTable({
  hoveredLetter,
  onHoverLetter,
  selectedLetter,
  onSelectLetter,
}: KeyTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Construct table rows based on original pool definitions
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Map each letter to its data from the pool
  const rows = alphabet.map((char) => {
    const pool = SYMBOL_POOLS[char] || [];
    let freq = "0.0%";
    let count = pool.length;

    // Frequencies from standard english text
    const freqs: Record<string, string> = {
      E: "12.7%", T: "9.1%", A: "8.2%", O: "7.5%", I: "7.0%", N: "6.7%",
      S: "6.3%", R: "6.0%", H: "6.1%", L: "4.0%", D: "4.3%", U: "2.8%",
      C: "2.8%", M: "2.4%", F: "2.2%", Y: "2.0%", W: "2.3%", G: "2.0%",
      P: "1.9%", B: "1.5%", V: "1.0%", K: "0.8%", X: "0.2%", J: "0.2%",
      Q: "0.1%", Z: "0.1%"
    };

    freq = freqs[char] || "0.0%";
    if (char === "Z") {
      count = 0;
    }

    return {
      letter: char,
      frequency: freq,
      symbolCount: count,
      pool: pool,
    };
  });

  const filteredRows = rows.filter(
    (row) =>
      row.letter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.pool.some((sym) => sym.includes(searchQuery))
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden text-white">
      {/* Title Header */}
      <div className="p-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider uppercase">
          Substitution Key Map
        </h2>
        <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono border border-zinc-800">
          100 Symbols (00-99)
        </span>
      </div>

      {/* Search box */}
      <div className="p-3 border-b border-zinc-900 bg-zinc-950">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search letter or symbol (e.g. '05')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
          />
        </div>
      </div>

      {/* Scrollable grid table */}
      <div className="flex-1 overflow-y-auto p-3 max-h-[320px]">
        <div className="space-y-1">
          {filteredRows.map((row) => {
            const isHovered = hoveredLetter === row.letter;
            const isSelected = selectedLetter === row.letter;

            return (
              <div
                key={row.letter}
                onMouseEnter={() => onHoverLetter(row.letter)}
                onMouseLeave={() => onHoverLetter(null)}
                onClick={() => onSelectLetter(isSelected ? null : row.letter)}
                className={`group flex items-center justify-between px-3 py-1.5 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-white text-black border-white"
                    : isHovered
                    ? "bg-zinc-900 border-zinc-700 text-white"
                    : "bg-zinc-950 border-zinc-900 text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {/* Letter and Frequency */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded text-sm font-bold border transition-colors ${
                      isSelected
                        ? "bg-black text-white border-black"
                        : isHovered
                        ? "bg-zinc-800 text-white border-zinc-700"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800"
                    }`}
                  >
                    {row.letter}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[9px] uppercase tracking-wide ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                      Freq
                    </span>
                    <span className="text-xs font-semibold font-mono">
                      {row.frequency}
                    </span>
                  </div>
                </div>

                {/* Symbols assigned */}
                <div className="flex-1 flex flex-col items-end px-4 overflow-hidden">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`text-[8px] uppercase tracking-wide ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                      Pool size:
                    </span>
                    <span className={`text-[9px] font-semibold font-mono ${isSelected ? 'text-zinc-850' : 'text-zinc-300'}`}>
                      {row.symbolCount}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-full overflow-hidden">
                    {row.letter === "Z" ? (
                      <span className={`text-[9px] italic ${isSelected ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        (Pool 98, 99)
                      </span>
                    ) : (
                      row.pool.map((sym) => (
                        <span
                          key={sym}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors border ${
                            isSelected
                              ? "bg-zinc-100 border-zinc-200 text-black font-semibold"
                              : isHovered
                              ? "bg-white border-zinc-400 text-black"
                              : "bg-zinc-900 border-zinc-800 text-zinc-300"
                          }`}
                        >
                          {sym}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Inspect Icon */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                  <Eye className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
                </div>
              </div>
            );
          })}

          {filteredRows.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No matching records found.
            </div>
          )}
        </div>
      </div>

      {/* Info Footnote */}
      <div className="p-3 border-t border-zinc-900 bg-zinc-950 text-[10px] text-zinc-400 leading-relaxed">
        <p>
          <strong>Homophonic Cipher:</strong> Multiple unique values represent each letter based on frequency to flatten distribution spikes and prevent analysis.
        </p>
      </div>
    </div>
  );
}
