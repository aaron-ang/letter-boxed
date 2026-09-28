import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import Dictionary from "./dictionary";
import { findOneWordSolutions } from "./gpu/gpuSolver";
import { isBetterSolution, Solver } from "./solver";
import { buildPuzzleContext, charOffset, type ValidWord } from "./types";

// Synthetic 3-letter puzzle (A=0, B=1, C=2) for testing ranking logic in isolation.
const TINY_MASK = 0b111;
const tinyWord = (word: string, coverageMask: number, first: number, last: number): ValidWord => ({
  word,
  coverageMask,
  firstLetterIdx: first,
  lastLetterIdx: last,
});
// 1-word solution (5 letters) vs. shorter 2-word chain AB -> BC (4 letters total).
const TINY_WORDS: ValidWord[] = [
  tinyWord("ABCAB", 0b111, 0, 1),
  tinyWord("AB", 0b011, 0, 1),
  tinyWord("BC", 0b110, 1, 2),
];

// Load dictionary synchronously for tests
let dict: Dictionary;

beforeAll(async () => {
  // Mock fetch for Dictionary.load
  const wordListPath = join(__dirname, "../../public/word_list.txt");
  const wordListText = readFileSync(wordListPath, "utf-8");
  global.fetch = async () =>
    ({
      text: async () => wordListText,
    }) as Response;

  dict = await Dictionary.load("/word_list.txt");
});

describe("solve()", () => {
  it("finds 2-word solution for SRG/MDH/IOL/ENP", () => {
    const ctx = buildPuzzleContext(["SRG", "MDH", "IOL", "ENP"]);
    const solver = new Solver(ctx, dict);
    const result = solver.solve();
    expect(result.success).toBe(true);
    expect(result.data[result.data.length - 1]).toEqual(["MORPHS", "SHIELDING"]);
  });

  it("finds 2-word solution for IMG/NAT/RCL/OSP", () => {
    const ctx = buildPuzzleContext(["IMG", "NAT", "RCL", "OSP"]);
    const solver = new Solver(ctx, dict);
    const result = solver.solve();
    expect(result.success).toBe(true);
    expect(result.data[result.data.length - 1]).toEqual(["MASCOT", "TRIPLING"]);
  });

  it("finds 5-word solution for ABC/DEF/GHI/JKL", { timeout: 30_000 }, () => {
    const ctx = buildPuzzleContext(["ABC", "DEF", "GHI", "JKL"]);
    const solver = new Solver(ctx, dict);
    const result = solver.solve();
    const solution = result.data[result.data.length - 1];
    expect(solution).toEqual(["LILA", "ALIKE", "ELI", "ILIAD", "DIE"]);
  });

  it("returns solvingProcess with intermediate states", () => {
    const ctx = buildPuzzleContext(["SRG", "MDH", "IOL", "ENP"]);
    const solver = new Solver(ctx, dict);
    const result = solver.solve();
    expect(result.success).toBe(true);
    // Should have intermediate states + final solution
    expect(result.data.length).toBeGreaterThan(1);
    // Each state is an array of non-empty strings
    for (const state of result.data) {
      expect(state.length).toBeGreaterThan(0);
      for (const word of state) {
        expect(word.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("findBestCPU()", () => {
  it("finds best 2-word solution for SRG/MDH/IOL/ENP", () => {
    const ctx = buildPuzzleContext(["SRG", "MDH", "IOL", "ENP"]);
    const validWords = dict.getValidWords(ctx);
    const result = Solver.findBestCPU(validWords, 2, ctx.allCoveredMask);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(["MORPHS", "SINGLED"]);
  });

  it("finds best 2-word solution for IMG/NAT/RCL/OSP", () => {
    const ctx = buildPuzzleContext(["IMG", "NAT", "RCL", "OSP"]);
    const validWords = dict.getValidWords(ctx);
    const result = Solver.findBestCPU(validWords, 2, ctx.allCoveredMask);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(["SCOT", "TRAMPLING"]);
  });

  it("returns empty for impossible 1-word solution", () => {
    const ctx = buildPuzzleContext(["SRG", "MDH", "IOL", "ENP"]);
    const validWords = dict.getValidWords(ctx);
    const result = Solver.findBestCPU(validWords, 1, ctx.allCoveredMask);
    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });

  it("prefers fewer words over fewer total letters", () => {
    for (const numWords of [2, 3]) {
      const result = Solver.findBestCPU(TINY_WORDS, numWords, TINY_MASK);
      expect(result).toEqual({ success: true, data: ["ABCAB"] });
    }
  });
});

describe("findOneWordSolutions() (GPU pre-pass)", () => {
  it("detects words that cover every letter on their own", () => {
    const sols = findOneWordSolutions(TINY_WORDS, TINY_MASK);
    expect(sols).toEqual([{ words: [0], totalChars: 5 }]);
  });

  it("returns nothing when no single word covers the puzzle", () => {
    const ctx = buildPuzzleContext(["SRG", "MDH", "IOL", "ENP"]);
    const validWords = dict.getValidWords(ctx);
    expect(findOneWordSolutions(validWords, ctx.allCoveredMask)).toEqual([]);
  });
});

describe("buildPuzzleContext()", () => {
  it("accepts 4 sides of 3 letters", () => {
    const ctx = buildPuzzleContext(["srg", "MDH", "IOL", "ENP"]);
    expect(ctx.letters).toHaveLength(12);
    expect(ctx.allCoveredMask).toBe(0xfff);
  });

  it.each([
    [["SRG", "MDH", "IOL"]],
    [["SRG", "MDH", "IOL", "ENP", "ABC"]],
    [["SRG", "MDH", "IOL", "EN"]],
    [["SRG", "MDH", "IOL", "ENPA"]],
    [["SRG", "MDH", "IOL", "EN1"]],
  ])("rejects malformed input %j", (sides) => {
    expect(() => buildPuzzleContext(sides)).toThrow(/4 sides of 3 letters/);
  });

  it("rejects duplicate letters", () => {
    expect(() => buildPuzzleContext(["SRG", "MDH", "IOL", "ENS"])).toThrow(/duplicate/);
  });
});

describe("findBestCPU() beyond two words", () => {
  it.each([
    [["DCE", "AUB", "HMW", "RNF"], 3, ["CHAMBER", "REFUND", "DAWN"]],
    [["HOP", "AGL", "UBI", "CDV"], 4, ["BAD", "DIP", "PLOUGH", "HAVOC"]],
    [["TNV", "EMY", "JPB", "RID"], 5, ["JIM", "MIND", "DEBT", "TYPE", "EVER"]],
  ])("finds the best solution for %j within %i words", (sides, numWords, expected) => {
    const ctx = buildPuzzleContext(sides);
    const validWords = dict.getValidWords(ctx);
    const result = Solver.findBestCPU(validWords, numWords, ctx.allCoveredMask);
    expect(result).toEqual({ success: true, data: expected });
  });

  it("stops at the fewest words even when more are allowed", () => {
    const ctx = buildPuzzleContext(["DCE", "AUB", "HMW", "RNF"]);
    const validWords = dict.getValidWords(ctx);
    const result = Solver.findBestCPU(validWords, 5, ctx.allCoveredMask);
    expect(result.data).toEqual(["CHAMBER", "REFUND", "DAWN"]);
  });

  it("reports no solution within five words", () => {
    const ctx = buildPuzzleContext(["ABC", "DEF", "GHI", "JKL"]);
    const validWords = dict.getValidWords(ctx);
    const result = Solver.findBestCPU(validWords, 5, ctx.allCoveredMask);
    expect(result).toEqual({ success: false, data: [] });
  });
});

describe("isBetterSolution()", () => {
  it("ranks fewer words above fewer total letters", () => {
    expect(isBetterSolution(["ABCAB"], ["AB", "BC"])).toBe(true);
    expect(isBetterSolution(["AB", "BC"], ["ABCAB"])).toBe(false);
    expect(isBetterSolution(["AB", "BC"], ["ABC", "CD"])).toBe(true);
    expect(isBetterSolution(["AB", "BD"], ["AB", "BC"])).toBe(false);
  });
});

describe("getValidWords()", () => {
  it("filters dictionary to puzzle-valid words", () => {
    const ctx = buildPuzzleContext(["SRG", "MDH", "IOL", "ENP"]);
    const validWords = dict.getValidWords(ctx);
    expect(validWords.length).toBeGreaterThan(0);
    expect(validWords.length).toBeLessThan(1000);
    // Every word should only contain puzzle letters
    const puzzleLetters = new Set(ctx.letters);
    for (const w of validWords) {
      for (const ch of w.word) {
        expect(puzzleLetters.has(ch)).toBe(true);
      }
    }
  });

  it("respects same-side constraint", () => {
    const ctx = buildPuzzleContext(["SRG", "MDH", "IOL", "ENP"]);
    const validWords = dict.getValidWords(ctx);
    for (const w of validWords) {
      for (let i = 1; i < w.word.length; i++) {
        const prevIdx = ctx.letterIndex[charOffset(w.word[i - 1])];
        const currIdx = ctx.letterIndex[charOffset(w.word[i])];
        expect(ctx.sideOf[prevIdx]).not.toBe(ctx.sideOf[currIdx]);
      }
    }
  });
});
