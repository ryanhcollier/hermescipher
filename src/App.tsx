/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  encryptMessage,
  decryptMessage,
  SAMPLE_MESSAGES,
} from "./utils/cipher";
import { CipherSymbol, CipherSettings, SymbolSelectionMode } from "./types";
import KeyTable from "./components/KeyTable";
import SpiralGrid from "./components/SpiralGrid";
import Controls from "./components/Controls";
import {
  Lock,
  Unlock,
  Copy,
  Check,
  RefreshCw,
  BookOpen,
  Download,
  Film,
} from "lucide-react";
import { exportGridToSvg, downloadSvg } from "./utils/exportSvg";
import { exportGridToVideo } from "./utils/exportVideo";

export default function App() {
  // Mode: "encrypt" or "decrypt"
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");

  // Inputs
  const [inputText, setInputText] = useState(SAMPLE_MESSAGES[0]);

  // Current calculated cipher sequence
  const [symbols, setSymbols] = useState<CipherSymbol[]>([]);

  // Timeline & Playback
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Interaction Hover / Selection highlights
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);
  const [scannedIndices, setScannedIndices] = useState<number[]>([]);

  // Matrix dropdown/collapsible state
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [isManualHovering, setIsManualHovering] = useState(false);

  // Settings
  const [settings, setSettings] = useState<CipherSettings>({
    selectionMode: "random",
    separator: "space",
    showSpiralLine: true,
    showIndices: true,
    colorByFrequency: false,
    playbackSpeed: 150, // Medium speed
    boxDisplayMode: "number",
  });

  // UI state
  const [copied, setCopied] = useState(false);

  // Process text whenever inputs or encryption/selection modes change
  useEffect(() => {
    let result: CipherSymbol[] = [];
    if (mode === "encrypt") {
      result = encryptMessage(inputText, settings.selectionMode);
    } else {
      result = decryptMessage(inputText);
    }
    setSymbols(result);
    setVisibleCount(result.length);
    setIsPlaying(false);
  }, [inputText, mode, settings.selectionMode]);

  // Handle multi-part scan animation with perimeter reveals
  useEffect(() => {
    if (isPlaying && !isManualHovering && symbols.length > 0) {
      const pickRandomScans = () => {
        const activeSymbols = symbols.filter(s => s.isLetter);
        if (activeSymbols.length === 0) {
          setScannedIndices([]);
          return;
        }

        // Pick 3 to 5 random distinct active symbol indices
        const countToPick = Math.min(Math.floor(Math.random() * 3) + 3, activeSymbols.length);
        const shuffled = [...activeSymbols].sort(() => 0.5 - Math.random());
        const picked = shuffled.slice(0, countToPick);

        const indices = picked
          .map(sym => symbols.findIndex(s => s.id === sym.id))
          .filter(idx => idx !== -1);
        setScannedIndices(indices);

        if (indices.length > 0) {
          setHoveredCellIndex(indices[0]);
          setHoveredLetter(symbols[indices[0]].originalChar.toUpperCase());
        }
      };

      pickRandomScans();
      const interval = setInterval(pickRandomScans, settings.playbackSpeed * 4);
      return () => {
        clearInterval(interval);
        setScannedIndices([]);
        setHoveredCellIndex(null);
        setHoveredLetter(null);
      };
    } else {
      setScannedIndices([]);
      if (!isManualHovering) {
        setHoveredCellIndex(null);
        setHoveredLetter(null);
      }
    }
  }, [isPlaying, isManualHovering, symbols, settings.playbackSpeed]);

  // Format ciphertext/plaintext for output copy block
  const formattedOutput = () => {
    const visibleSymbols = symbols.slice(0, visibleCount);
    if (mode === "encrypt") {
      let out = "";
      for (let i = 0; i < visibleSymbols.length; i++) {
        const s = visibleSymbols[i];
        if (s.isLetter) {
          out += s.encryptedValue;
          const next = i + 1 < visibleSymbols.length ? visibleSymbols[i + 1] : null;
          if (next && next.isLetter && settings.separator !== "none") {
            out += settings.separator === "space" ? " " : "-";
          }
        } else {
          out += s.encryptedValue;
        }
      }
      return out;
    } else {
      return visibleSymbols.map((s) => s.selectedDecryptedChar).join("");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedOutput());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadRandomSample = () => {
    const filterQuotes = SAMPLE_MESSAGES.filter((q) => q !== inputText);
    const quote = filterQuotes[Math.floor(Math.random() * filterQuotes.length)] || SAMPLE_MESSAGES[0];
    setInputText(quote);
    setTimeout(() => setIsPlaying(true), 200);
  };

  // Toggle J/Z or Q/Z candidates during decryption
  const handleToggleCandidate = (charIndex: number) => {
    setSymbols((prev) => {
      const updated = [...prev];
      const sym = updated[charIndex];
      if (sym && sym.decryptedCandidates.length > 1) {
        const currentIdx = sym.decryptedCandidates.indexOf(sym.selectedDecryptedChar);
        const nextIdx = (currentIdx + 1) % sym.decryptedCandidates.length;
        sym.selectedDecryptedChar = sym.decryptedCandidates[nextIdx];
        sym.originalChar = sym.selectedDecryptedChar; // sync
      }
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col antialiased relative overflow-hidden select-none selection:bg-zinc-800 selection:text-white">
      
      {/* Premium minimal header */}
      <header className="border-b border-zinc-900 bg-black py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_#fff]" />
            <span className="text-sm font-black uppercase tracking-[0.2em] text-white">
              HERMES CIPHER
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            v1.2.0 // CRYPTO.STREAM
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        
        {/* Left Side: Inputs, Settings, Collapsible Key Map Table */}
        <section className="lg:col-span-5 space-y-6 flex flex-col h-full">
          
          {/* Card: Mode & Inputs */}
          <div className="bg-black border border-zinc-850 rounded-lg p-5 space-y-4">
            
            {/* Mode Switcher Buttons */}
            <div className="flex bg-zinc-950 p-1 rounded border border-zinc-900 relative">
              <button
                onClick={() => {
                  setMode("encrypt");
                  setInputText("THE EAGLE HAS LANDED IN THE SECRET GARDEN");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-bold uppercase transition-all z-10 cursor-pointer ${
                  mode === "encrypt"
                    ? "bg-white text-black font-bold"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Encrypt Text
              </button>
              <button
                onClick={() => {
                  setMode("decrypt");
                  setInputText("63 62 05 / 23 21 90 68 03   67 21 54 / 69 22 45 74 08 72   38 43 / 20 62 04   50 09 81 58 02 20 / 90 22 57 73 01 44");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-bold uppercase transition-all z-10 cursor-pointer ${
                  mode === "decrypt"
                    ? "bg-white text-black font-bold"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Unlock className="w-3.5 h-3.5" />
                Decrypt Cipher
              </button>
            </div>

            {/* Input Message Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <label className="text-zinc-400 font-bold uppercase tracking-wider">
                  {mode === "encrypt" ? "Plaintext Message" : "Ciphertext Stream (Spaces & symbols)"}
                </label>
                <span className="text-zinc-500 font-mono text-[9px]">
                  {inputText.length} chars
                </span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  mode === "encrypt"
                    ? "Type a secret message to encrypt..."
                    : "Paste encrypted symbols (e.g., '63 15 68 70 32')..."
                }
                className="w-full h-24 px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all leading-relaxed resize-none"
              />
            </div>

            {/* Display Output Block */}
            <div className="bg-zinc-950 border border-zinc-900 rounded p-3.5 space-y-2 text-white">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  {mode === "encrypt" ? "Generated Ciphertext Output" : "Decrypted Plaintext Output"}
                </span>
                <button
                  onClick={handleCopy}
                  disabled={symbols.length === 0}
                  className="flex items-center gap-1 text-[9px] text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-zinc-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5 text-zinc-400" />
                      Copy Stream
                    </>
                  )}
                </button>
              </div>

              {/* Code Output Visual */}
              <div className="w-full bg-black rounded border border-zinc-900 p-3 font-mono text-xs leading-relaxed text-white min-h-[50px] max-h-[120px] overflow-y-auto break-all relative selection:bg-zinc-850 selection:text-white">
                {formattedOutput() ? (
                  formattedOutput()
                ) : (
                  <span className="text-zinc-500 italic text-xs font-sans">
                    Please enter text above to view results.
                  </span>
                )}
              </div>
            </div>

            {/* Selection modes & delimiters - conditional based on mode */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              {mode === "encrypt" ? (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Pool Pick Algorithm
                  </span>
                  <select
                    value={settings.selectionMode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        selectionMode: e.target.value as SymbolSelectionMode,
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:outline-none focus:border-white cursor-pointer"
                  >
                    <option value="random">🎲 Random pick</option>
                    <option value="sequential">🔄 Sequential (Rot)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Ambiguity Method
                  </span>
                  <div className="text-[10px] text-zinc-300 bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-900 flex items-center justify-between">
                    <span>Smart Predictor</span>
                    <span className="text-[8px] bg-zinc-800 text-zinc-200 border border-zinc-700 px-1 rounded font-bold">
                      Active
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Separator Style
                </span>
                <select
                  value={settings.separator}
                  disabled={mode === "decrypt"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      separator: e.target.value as "space" | "dash" | "none",
                    })
                  }
                  className="w-full px-2 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:outline-none focus:border-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="space">Space (" ")</option>
                  <option value="dash">Dash ("-")</option>
                  <option value="none">None (Cont)</option>
                </select>
              </div>
            </div>

            {/* Quick-action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={loadRandomSample}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700 text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Randomize Stream
              </button>
            </div>
          </div>

          {/* Collapsible Key Map Section */}
          <div className="border border-zinc-850 rounded-lg overflow-hidden bg-black text-white">
            <button
              onClick={() => setIsMappingOpen(!isMappingOpen)}
              className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider bg-zinc-950 hover:bg-zinc-900 transition-colors border-b border-zinc-900"
            >
              <div className="flex items-center gap-2">
                <span>Substitution Key Map</span>
                <span className="text-[10px] text-zinc-500 font-normal normal-case">
                  ({isMappingOpen ? "click to collapse" : "click to expand"})
                </span>
              </div>
              <span className="text-xs">{isMappingOpen ? "▲" : "▼"}</span>
            </button>
            {isMappingOpen && (
              <div className="p-1 border-t border-zinc-900 max-h-[380px] overflow-y-auto bg-zinc-950">
                <KeyTable
                  hoveredLetter={hoveredLetter}
                  onHoverLetter={setHoveredLetter}
                  selectedLetter={selectedLetter}
                  onSelectLetter={setSelectedLetter}
                />
              </div>
            )}
          </div>

          {/* Timeline & View Controls moved to be under key map */}
          <Controls
            isPlaying={isPlaying}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            settings={settings}
            onUpdateSettings={(newSet) => setSettings({ ...settings, ...newSet })}
            onExportSvg={() => {
              const svgString = exportGridToSvg(symbols, settings);
              downloadSvg(svgString, `hermes-grid-${Date.now()}.svg`);
            }}
            onExportVideo={async () => {
              setVideoProgress(0);
              try {
                await exportGridToVideo(symbols, settings, (p) => {
                  setVideoProgress(p);
                });
              } catch (err) {
                console.error("Video generation failed:", err);
              } finally {
                setVideoProgress(null);
              }
            }}
            symbolsCount={symbols.length}
            isExportingVideo={videoProgress !== null}
          />
        </section>

        {/* Right Side: The Spiral Visualizer and Output Blocks */}
        <section className="lg:col-span-7 flex flex-col items-center justify-center">
          
          {/* Main Visualizer Stage - exact 9:16 ratio */}
          <div 
            className="bg-black border border-zinc-800 rounded-lg overflow-hidden p-6 relative text-white animate-fade-in w-full max-w-[450px] aspect-[9/16] flex flex-col justify-center items-center"
            onMouseEnter={() => setIsManualHovering(true)}
            onMouseLeave={() => setIsManualHovering(false)}
          >
            {/* The canvas itself */}
            <SpiralGrid
              symbols={symbols}
              visibleCount={visibleCount}
              settings={settings}
              hoveredLetter={hoveredLetter}
              onHoverLetter={setHoveredLetter}
              selectedLetter={selectedLetter}
              onToggleCandidate={handleToggleCandidate}
              hoveredCellIndex={hoveredCellIndex}
              onHoverCellIndex={setHoveredCellIndex}
              scannedIndices={scannedIndices}
              isPlaying={isPlaying}
            />

            {/* Video compile overlay */}
            {videoProgress !== null && (
              <div className="absolute inset-0 bg-black/95 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-center p-6 transition-all">
                <div className="w-12 h-12 rounded-full border-2 border-white border-t-transparent animate-spin mb-4" />
                <span className="text-xs font-black uppercase tracking-widest text-white">
                  Compiling 9:16 Loop Video
                </span>
                <span className="text-[11px] font-mono text-zinc-300 mt-1 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded">
                  {videoProgress}% Rendered
                </span>
                <p className="text-[10px] text-zinc-500 mt-4 max-w-[240px] leading-relaxed">
                  Generating a high-fidelity 10.0s animation loop matching your active settings. Please do not close this window...
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Applet footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-[10px] text-zinc-400 font-sans mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Hermes Cipher: Homophonic Substitution Mapping Tool with Outward-Spiraling Visualizations.
          </span>
          <span className="font-mono text-[9px] tracking-wider text-zinc-500">
            SYSTEM CORE // HERMES GRID
          </span>
        </div>
      </footer>
    </div>
  );
}
