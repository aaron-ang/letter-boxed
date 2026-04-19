export type SolverRequest =
  | { type: "solve"; sides: string[] }
  | { type: "findBest"; sides: string[]; numWords: number };

export type SolverResponse =
  | { type: "solveResult"; success: boolean; data: string[][] }
  | { type: "findBestResult"; success: boolean; data: string[] }
  | { type: "error"; message: string };

export interface PuzzleContext {
  sides: string[];
  letters: string[];
  letterIndex: Int8Array; // -1 if not in puzzle, else 0..11
  letterBit: Int32Array; // 0 if not in puzzle, else 1 << index
  sideOf: Int8Array; // sideOf[i] = 0..3 for letter index i; -1 unused
  allCoveredMask: number;
}

export interface ValidWord {
  word: string;
  coverageMask: number;
  firstLetterIdx: number;
  lastLetterIdx: number;
}

export function charOffset(ch: string): number {
  return ch.charCodeAt(0) - "A".charCodeAt(0);
}

export function getLetterIndex(ctx: PuzzleContext, ch: string): number {
  return ctx.letterIndex[charOffset(ch)];
}

export function getLetterBit(ctx: PuzzleContext, ch: string): number {
  return ctx.letterBit[charOffset(ch)];
}

export function buildPuzzleContext(sides: string[]): PuzzleContext {
  const letters: string[] = [];
  const letterIndex = new Int8Array(26).fill(-1);
  const letterBit = new Int32Array(26).fill(0);
  const sideOf = new Int8Array(12).fill(-1);

  for (let sideIdx = 0; sideIdx < sides.length; sideIdx++) {
    for (let j = 0; j < sides[sideIdx].length; j++) {
      const letter = sides[sideIdx][j].toUpperCase();
      const idx = letters.length;
      const offset = charOffset(letter);

      if (letterIndex[offset] !== -1) {
        throw new Error(`duplicate letter in puzzle: ${letter}`);
      }

      letters.push(letter);
      letterIndex[offset] = idx;
      letterBit[offset] = 1 << idx;
      sideOf[idx] = sideIdx;
    }
  }

  return {
    sides,
    letters,
    letterIndex,
    letterBit,
    sideOf,
    allCoveredMask: (1 << letters.length) - 1,
  };
}
