/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Play, Pause, Zap, Download, Film } from "lucide-react";
import { CipherSettings } from "../types";

interface ControlsProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  settings: CipherSettings;
  onUpdateSettings: (settings: Partial<CipherSettings>) => void;
  onExportSvg: () => void;
  onExportVideo: () => void;
  symbolsCount: number;
  isExportingVideo: boolean;
}

export default function Controls({
  isPlaying,
  onPlayToggle,
  settings,
  onUpdateSettings,
  onExportSvg,
  onExportVideo,
  symbolsCount,
  isExportingVideo,
}: ControlsProps) {
  // Speed options mapping slider values to milliseconds
  const speedOptions = [
    { label: "Slow", ms: 800 },
    { label: "Med", ms: 400 },
    { label: "Fast", ms: 150 },
    { label: "Hyper", ms: 40 },
  ];

  return (
    <div className="bg-black border border-zinc-800 rounded-lg p-4 space-y-4 text-white">
      {/* Main Playback Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onPlayToggle}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isPlaying
                ? "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current animate-pulse" />
                Stop Scan
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Play Auto-Scan
              </>
            )}
          </button>

          <button
            onClick={onExportSvg}
            disabled={symbolsCount === 0}
            className="flex items-center gap-1.5 text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-900 disabled:opacity-40 disabled:pointer-events-none border border-zinc-800 px-3 py-1.5 rounded cursor-pointer transition-colors font-semibold"
            title="Download current grid as vector SVG image"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            Export SVG
          </button>

          <button
            onClick={onExportVideo}
            disabled={symbolsCount === 0 || isExportingVideo}
            className="flex items-center gap-1.5 text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-900 disabled:opacity-40 disabled:pointer-events-none border border-zinc-800 px-3 py-1.5 rounded cursor-pointer transition-colors font-semibold"
            title="Export a looping 10-second video (9:16 portrait)"
          >
            <Film className="w-3.5 h-3.5 text-zinc-400" />
            Export Video
          </button>
        </div>

        {/* Playback speed selector */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-800">
          <Zap className="w-3.5 h-3.5 text-zinc-400 ml-1.5 mr-1" />
          {speedOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onUpdateSettings({ playbackSpeed: opt.ms })}
              className={`px-2 py-1 rounded text-[9px] font-semibold transition-all cursor-pointer ${
                settings.playbackSpeed === opt.ms
                  ? "bg-white text-black font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual toggle switches (Indices, Frequency mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-900">
        <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 transition-colors select-none">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Box Display
            </span>
            <span className="text-[9px] text-zinc-400">Show assigned value</span>
          </div>
          <select
            value={settings.boxDisplayMode}
            onChange={(e) => onUpdateSettings({ boxDisplayMode: e.target.value as "number" | "letter" | "both" })}
            className="text-[10px] font-semibold bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 focus:outline-none focus:border-white cursor-pointer text-white"
          >
            <option value="both">Show Both</option>
            <option value="number">Number Only</option>
            <option value="letter">Letter Only</option>
          </select>
        </div>

        <label className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 transition-colors cursor-pointer select-none">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Frequency map
            </span>
            <span className="text-[9px] text-zinc-400">Subtle gray shading</span>
          </div>
          <input
            type="checkbox"
            checked={settings.colorByFrequency}
            onChange={(e) => onUpdateSettings({ colorByFrequency: e.target.checked })}
            className="w-4 h-4 rounded text-white border border-zinc-700 bg-zinc-900 focus:ring-white accent-white cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
