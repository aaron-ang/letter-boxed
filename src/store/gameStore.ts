import { create } from "zustand";

const COMMON_CHARS = "EARIOTNSLCUDPMHGB"; // Source: https://www3.nd.edu/~busiforc/handouts/cryptography/letterfrequencies.html
const FIELD_COUNT = 12;

function emptyFields(): Record<number, string> {
  return Object.fromEntries(Array.from({ length: FIELD_COUNT }, (_, i) => [i, ""]));
}

export function groupLetters(fields: Record<number, string>): string[] {
  const arr = Object.values(fields);
  if (arr.some((v) => v === "")) throw new Error("Please fill out all fields");
  return [0, 3, 6, 9].map((start) => arr.slice(start, start + 3).join(""));
}

export interface LetterUsage {
  word: number;
  position: number;
}

// Each char in the step = one usage. Position is the char's index within its own word (0-based).
function computeUsages(step: string[], fields: Record<number, string>): LetterUsage[][] {
  const usages: LetterUsage[][] = Array.from({ length: FIELD_COUNT }, () => []);
  const fieldChars = Object.values(fields);

  for (let w = 0; w < step.length; w++) {
    for (let ci = 0; ci < step[w].length; ci++) {
      const idx = fieldChars.indexOf(step[w][ci]);
      if (idx === -1) continue;
      usages[idx].push({ word: w, position: ci });
    }
  }
  return usages;
}

export interface GameState {
  fields: Record<number, string>;
  solution: string[];
  visualize: boolean;
  isSuccess: boolean;
  delay: number;
  solving: boolean;
  prevInput: string[];
  prevProcess: string[][];
  bestSolution: string[];
  usages: LetterUsage[][];
  disabledFields: boolean[];
  currentStep: number;

  setFieldAt: (key: string | number, value: string) => void;
  setFields: (fields: Record<number, string>) => void;
  setVisualize: (v: boolean) => void;
  setDelay: (d: number) => void;
  setSolving: (s: boolean) => void;
  setSolution: (words: string[]) => void;
  setBestSolution: (words: string[]) => void;
  setIsSuccess: (b: boolean) => void;
  setPrevInput: (arr: string[]) => void;
  setPrevProcess: (arr: string[][]) => void;

  applyStep: (step: string[], opts?: { disableOthers?: boolean }) => void;
  gotoStep: (idx: number) => void;
  resetHighlights: () => void;
  generateRandom: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  fields: emptyFields(),
  solution: [],
  visualize: false,
  isSuccess: true,
  delay: 5,
  solving: false,
  prevInput: [],
  prevProcess: [],
  bestSolution: [],
  usages: Array.from({ length: FIELD_COUNT }, () => []),
  disabledFields: [],
  currentStep: 0,

  setFieldAt: (key, value) => set((s) => ({ fields: { ...s.fields, [key]: value.toUpperCase() } })),
  setFields: (fields) => set({ fields }),
  setVisualize: (visualize) => set({ visualize }),
  setDelay: (delay) => set({ delay }),
  setSolving: (solving) => set({ solving }),
  setSolution: (solution) => set({ solution }),
  setBestSolution: (bestSolution) => set({ bestSolution }),
  setIsSuccess: (isSuccess) => set({ isSuccess }),
  setPrevInput: (prevInput) => set({ prevInput }),
  setPrevProcess: (prevProcess) => set({ prevProcess }),

  applyStep: (step, opts) => {
    const usages = computeUsages(step, get().fields);
    const disabled = opts?.disableOthers ? usages.map((u) => u.length === 0) : [];
    set({ solution: step, usages, disabledFields: disabled });
  },

  gotoStep: (idx) => {
    const process = get().prevProcess;
    if (idx < 0 || idx >= process.length) return;
    const step = process[idx];
    const usages = computeUsages(step, get().fields);
    set({
      currentStep: idx,
      solution: step,
      usages,
      disabledFields: usages.map((u) => u.length === 0),
    });
  },

  resetHighlights: () =>
    set({
      usages: Array.from({ length: FIELD_COUNT }, () => []),
      disabledFields: [],
    }),

  generateRandom: () => {
    const charSet = new Set<string>();
    while (charSet.size < FIELD_COUNT) {
      charSet.add(COMMON_CHARS[Math.floor(Math.random() * COMMON_CHARS.length)]);
    }
    const chars = [...charSet];
    const fields: Record<number, string> = {};
    for (let i = 0; i < FIELD_COUNT; i++) fields[i] = chars[i];
    set({
      fields,
      solution: [],
      prevInput: [],
      prevProcess: [],
      bestSolution: [],
      isSuccess: true,
      usages: Array.from({ length: FIELD_COUNT }, () => []),
      disabledFields: [],
      currentStep: 0,
    });
  },
}));
