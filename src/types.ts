/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CipherSymbol {
  id: string; // unique id for rendering keys
  charIndex: number; // position in the message
  originalChar: string; // e.g. "H" or " " or "?"
  encryptedValue: string; // e.g. "64" or " " or "?"
  isLetter: boolean; // true if it was an alphabetic character A-Z
  decryptedCandidates: string[]; // e.g. ["J", "Z"] for "98"
  selectedDecryptedChar: string; // currently selected decrypted character
  spiralIndex: number; // index in the spiral coordinate path
  x: number; // spiral grid column index (relative to center)
  y: number; // spiral grid row index (relative to center)
}

export type SymbolSelectionMode = "random" | "sequential";

export interface CipherSettings {
  selectionMode: SymbolSelectionMode;
  separator: "space" | "dash" | "none";
  showSpiralLine: boolean;
  showIndices: boolean;
  colorByFrequency: boolean;
  playbackSpeed: number; // ms per character
  boxDisplayMode: "number" | "letter" | "both";
}

export interface LetterMapInfo {
  letter: string;
  frequency: number;
  symbolCount: number;
  symbols: string[];
}
