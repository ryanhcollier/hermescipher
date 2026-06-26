/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CipherSymbol, SymbolSelectionMode } from "../types";

// Raw range definitions based on the provided table
export const SYMBOL_POOLS: Record<string, string[]> = {
  E: Array.from({ length: 12 }, (_, i) => String(i).padStart(2, "0")), // 00-11
  T: Array.from({ length: 9 }, (_, i) => String(i + 12).padStart(2, "0")), // 12-20
  A: Array.from({ length: 8 }, (_, i) => String(i + 21).padStart(2, "0")), // 21-28
  O: Array.from({ length: 7 }, (_, i) => String(i + 29).padStart(2, "0")), // 29-35
  I: Array.from({ length: 7 }, (_, i) => String(i + 36).padStart(2, "0")), // 36-42
  N: Array.from({ length: 7 }, (_, i) => String(i + 43).padStart(2, "0")), // 43-49
  S: Array.from({ length: 6 }, (_, i) => String(i + 50).padStart(2, "0")), // 50-55
  R: Array.from({ length: 6 }, (_, i) => String(i + 56).padStart(2, "0")), // 56-61
  H: Array.from({ length: 6 }, (_, i) => String(i + 62).padStart(2, "0")), // 62-67
  L: Array.from({ length: 4 }, (_, i) => String(i + 68).padStart(2, "0")), // 68-71
  D: Array.from({ length: 4 }, (_, i) => String(i + 72).padStart(2, "0")), // 72-75
  U: Array.from({ length: 3 }, (_, i) => String(i + 76).padStart(2, "0")), // 76-78
  C: Array.from({ length: 3 }, (_, i) => String(i + 79).padStart(2, "0")), // 79-81
  M: Array.from({ length: 2 }, (_, i) => String(i + 82).padStart(2, "0")), // 82-83
  F: Array.from({ length: 2 }, (_, i) => String(i + 84).padStart(2, "0")), // 84-85
  Y: Array.from({ length: 2 }, (_, i) => String(i + 86).padStart(2, "0")), // 86-87
  W: Array.from({ length: 2 }, (_, i) => String(i + 88).padStart(2, "0")), // 88-89
  G: Array.from({ length: 2 }, (_, i) => String(i + 90).padStart(2, "0")), // 90-91
  P: Array.from({ length: 2 }, (_, i) => String(i + 92).padStart(2, "0")), // 92-93
  B: ["94"],
  V: ["95"],
  K: ["96"],
  X: ["97"],
  J: ["98"],
  Q: ["99"],
  Z: ["98", "99"], // Z shares 98 (J) and 99 (Q) pools as per instructions
};

// Reverse lookup map for decryption
export const REVERSE_MAP: Record<string, string[]> = {};
// Pre-populate reverse map
for (let charCode = 0; charCode < 100; charCode++) {
  const symbol = String(charCode).padStart(2, "0");
  const candidates: string[] = [];

  // Search which letters can map to this symbol
  for (const [letter, pool] of Object.entries(SYMBOL_POOLS)) {
    if (pool.includes(symbol)) {
      candidates.push(letter);
    }
  }

  REVERSE_MAP[symbol] = candidates;
}

/**
 * Generate outward spiral coordinates.
 * Starts at 0,0 and spirals outwards.
 */
export function getSpiralCoordinates(count: number): { x: number; y: number }[] {
  const coords: { x: number; y: number }[] = [];
  if (count <= 0) return coords;

  let x = 0;
  let y = 0;
  coords.push({ x, y });

  let stepSize = 1;
  let dir = 0; // 0: Right, 1: Down, 2: Left, 3: Up
  const dx = [1, 0, -1, 0];
  const dy = [0, 1, 0, -1];

  while (coords.length < count) {
    for (let i = 0; i < 2; i++) {
      for (let s = 0; s < stepSize; s++) {
        if (coords.length >= count) break;
        x += dx[dir];
        y += dy[dir];
        coords.push({ x, y });
      }
      dir = (dir + 1) % 4;
      if (coords.length >= count) break;
    }
    stepSize++;
  }

  return coords;
}

/**
 * Encrypt a custom message using homophonic substitution.
 */
export function encryptMessage(
  message: string,
  mode: SymbolSelectionMode
): CipherSymbol[] {
  const normalized = message.toUpperCase();
  const result: CipherSymbol[] = [];
  const symbolCounts: Record<string, number> = {};

  // Initialize selection index pointers for sequential mode
  for (const letter of Object.keys(SYMBOL_POOLS)) {
    symbolCounts[letter] = 0;
  }

  const coords = getSpiralCoordinates(normalized.length);

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const coord = coords[i];
    const isLetter = char >= "A" && char <= "Z";

    let encryptedValue = char;
    let decryptedCandidates = [char];

    if (isLetter) {
      const pool = SYMBOL_POOLS[char];
      if (pool && pool.length > 0) {
        if (mode === "random") {
          const randIndex = Math.floor(Math.random() * pool.length);
          encryptedValue = pool[randIndex];
        } else {
          // Sequential / Round Robin
          const seqIndex = symbolCounts[char] % pool.length;
          encryptedValue = pool[seqIndex];
          symbolCounts[char]++;
        }
        decryptedCandidates = REVERSE_MAP[encryptedValue] || [char];
      }
    }

    result.push({
      id: `enc-${i}-${encryptedValue}`,
      charIndex: i,
      originalChar: char,
      encryptedValue,
      isLetter,
      decryptedCandidates,
      selectedDecryptedChar: isLetter ? char : char, // Default to correct answer during encryption
      spiralIndex: i,
      x: coord.x,
      y: coord.y,
    });
  }

  return result;
}

/**
 * Smart context predictor for J vs Z (symbol 98) and Q vs Z (symbol 99)
 * inside an encrypted sequence.
 */
export function guessBestCandidate(
  symbolValue: string,
  prevChar: string,
  nextChar: string
): string {
  if (symbolValue === "98") {
    // 98 is J or Z
    // Z is common in "SIZE", "ZONE", "ZERO", "PUZZLE", "AMAZING", "CRAZY", "BUZZ"
    // J is common in "JUST", "JOIN", "JOB", "JOY", "PROJECT", "OBJECT", "SUBJECT"
    // If followed by U, J is extremely rare (almost no common words), whereas Z is followed by O/E/E etc.
    // Let's do some clean heuristics:
    if (nextChar === "U") return "J"; // e.g. JUST, JUDGE
    if (nextChar === "O" || nextChar === "E") {
      // both are common, let's default J as it is more frequent overall in English text than Z
      return "J";
    }
    // If preceded by U, it's often Z (e.g. PUZZLE, BUZZ)
    if (prevChar === "U") return "Z";
    return "J";
  }

  if (symbolValue === "99") {
    // 99 is Q or Z
    // Q is almost ALWAYS followed by U in English! ("QUICK", "QUIET", "QUESTION", "EQUAL")
    if (nextChar === "U") return "Q";
    // If not followed by U, it is almost certainly Z! (e.g. ZONE, SIZE, CRAZY)
    return "Z";
  }

  return symbolValue;
}

/**
 * Parse a ciphertext string and construct a sequence of CipherSymbols.
 * Automatically handles space-separated, dash-separated, or continuous digit streams.
 */
export function decryptMessage(ciphertext: string): CipherSymbol[] {
  const symbols: string[] = [];
  let i = 0;

  // Let's inspect the format of ciphertext
  // We clean up characters but keep track of spaces and punctuation.
  // First, if there are dashes, split or convert dashes to spaces.
  const preparedText = ciphertext.replace(/-/g, " ");

  // Tokenize the text to find 2-digit numbers, spaces, and punctuation
  while (i < preparedText.length) {
    const char = preparedText[i];

    // Check if we have a 2-digit number at this position
    if (/\d/.test(char) && i + 1 < preparedText.length && /\d/.test(preparedText[i + 1])) {
      const numStr = preparedText.substring(i, i + 2);
      symbols.push(numStr);
      i += 2;
    } else {
      // It is a spacing or punctuation
      if (char === " ") {
        // If there are multiple spaces, we can compress them or preserve one
        // Let's preserve a space token
        symbols.push(" ");
        i++;
      } else {
        symbols.push(char);
        i++;
      }
    }
  }

  // Filter out excessive spaces to keep a neat sequence:
  // e.g., if we have multiple consecutive spaces from delimiters, we can compress them.
  const cleanSymbols: string[] = [];
  let lastWasSpace = false;
  for (const s of symbols) {
    if (s === " ") {
      if (!lastWasSpace) {
        cleanSymbols.push(" ");
        lastWasSpace = true;
      }
    } else {
      cleanSymbols.push(s);
      lastWasSpace = false;
    }
  }

  // Map symbols to CipherSymbols with coordinate tracking
  const coords = getSpiralCoordinates(cleanSymbols.length);
  const result: CipherSymbol[] = [];

  for (let sIdx = 0; sIdx < cleanSymbols.length; sIdx++) {
    const symbolVal = cleanSymbols[sIdx];
    const coord = coords[sIdx];
    const isNumber = /^\d{2}$/.test(symbolVal);

    let originalChar = symbolVal;
    let decryptedCandidates: string[] = [symbolVal];
    let selectedDecryptedChar = symbolVal;

    if (isNumber) {
      decryptedCandidates = REVERSE_MAP[symbolVal] || ["?"];
      // Run smart context prediction
      const prev = sIdx > 0 ? cleanSymbols[sIdx - 1] : "";
      const next = sIdx + 1 < cleanSymbols.length ? cleanSymbols[sIdx + 1] : "";
      
      // If we have candidates, guess the best one
      if (decryptedCandidates.length > 1) {
        // Find best guess using adjacent symbols (if decrypted already, but we can guess using next symbol's candidate mapping)
        let nextLetterGuess = "";
        if (next && /^\d{2}$/.test(next)) {
          const nextCandidates = REVERSE_MAP[next];
          if (nextCandidates && nextCandidates.length > 0) {
            nextLetterGuess = nextCandidates[0]; // Take primary candidate for heuristic
          }
        } else if (next) {
          nextLetterGuess = next.toUpperCase();
        }

        let prevLetterGuess = "";
        if (prev && /^\d{2}$/.test(prev)) {
          const prevCandidates = REVERSE_MAP[prev];
          if (prevCandidates && prevCandidates.length > 0) {
            prevLetterGuess = prevCandidates[0];
          }
        } else if (prev) {
          prevLetterGuess = prev.toUpperCase();
        }

        selectedDecryptedChar = guessBestCandidate(symbolVal, prevLetterGuess, nextLetterGuess);
      } else {
        selectedDecryptedChar = decryptedCandidates[0] || "?";
      }
      originalChar = selectedDecryptedChar; // For decrypting, we map originalChar to our best guess
    }

    result.push({
      id: `dec-${sIdx}-${symbolVal}`,
      charIndex: sIdx,
      originalChar,
      encryptedValue: symbolVal,
      isLetter: isNumber,
      decryptedCandidates,
      selectedDecryptedChar,
      spiralIndex: sIdx,
      x: coord.x,
      y: coord.y,
    });
  }

  return result;
}

/**
 * Get color code for letters based on English language frequency.
 * E is darkest gray/black, rare letters are white.
 */
export function getFrequencyColor(char: string): string {
  const c = char.toUpperCase();
  if (c === "E") return "text-black border-white bg-white font-bold";
  if ("TAOIN".includes(c)) return "text-black border-zinc-300 bg-zinc-200 font-bold";
  if ("SRHLD".includes(c)) return "text-white border-zinc-500 bg-zinc-500";
  if ("UCUMF".includes(c)) return "text-white border-zinc-600 bg-zinc-700";
  if ("YWGPM".includes(c)) return "text-zinc-300 border-zinc-800 bg-zinc-800";
  if ("BVKXJQZ".includes(c)) return "text-zinc-500 border-zinc-900 bg-zinc-900";
  return "text-zinc-600 border-zinc-950 bg-zinc-950";
}

/**
 * Remove all glowing effects for a clean unstylized UI
 */
export function getGlowClass(char: string): string {
  return "";
}

/**
 * Mystery cryptogram quotes for user quick-start exploration
 */
export const SAMPLE_MESSAGES = [
  "THE EAGLE HAS LANDED IN THE SECRET GARDEN",
  "CRYPTOGRAPHY IS THE SCIENCE OF SECRET WRITING AND HIDDEN CODES",
  "A ENIGMA SOLVED IS A MYSTERY DISPELLED",
  "JUST QUANTIZE THE ZERO ZONE FOR MAXIMUM CYBER SECURITY",
  "BE SURE TO DRINK YOUR OVALTINE",
  "KNOWLEDGE IS POWER ONLY IF SHARED AND PROTECTED SECURELY",
];
