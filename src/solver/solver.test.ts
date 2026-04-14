import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import Dictionary from "./dictionary";
import { Solver } from "./solver";
import { buildPuzzleContext } from "./types";

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
});

describe("findBestBacktracking()", () => {
  it("finds best 2-word solution via backtracking", () => {
    const ctx = buildPuzzleContext(["SRG", "MDH", "IOL", "ENP"]);
    const solver = new Solver(ctx, dict);
    const result = solver.findBestBacktracking(2);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(["MORPHS", "SINGLED"]);
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
        const prevIdx = ctx.letterIndex[w.word.charCodeAt(i - 1) - 65];
        const currIdx = ctx.letterIndex[w.word.charCodeAt(i) - 65];
        expect(ctx.sideOf[prevIdx]).not.toBe(ctx.sideOf[currIdx]);
      }
    }
  });
});
