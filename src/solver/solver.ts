import type Dictionary from "./dictionary";
import {
  getLetterBit,
  getLetterIndex,
  LETTER_COUNT,
  MOST_WORDS,
  type PuzzleContext,
  type ValidWord,
} from "./types";

/** Find Best ranking: fewest words, then fewest total letters, then alphabetical. */
export function isBetterSolution(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return a.length < b.length;
  const aStr = a.join("");
  const bStr = b.join("");
  if (aStr.length !== bStr.length) return aStr.length < bStr.length;
  return aStr.localeCompare(bStr) < 0;
}

export class Solver {
  private ctx: PuzzleContext;
  private dictionary: Dictionary;
  private words: string[];
  private wordCoverage: number[];
  private solvingProcess: string[][];

  constructor(ctx: PuzzleContext, dictionary: Dictionary) {
    this.ctx = ctx;
    this.dictionary = dictionary;
    this.words = Array.from({ length: MOST_WORDS }, () => "");
    this.wordCoverage = new Array(MOST_WORDS).fill(0);
    this.solvingProcess = [];
  }

  private allLettersUsed(): boolean {
    let combined = 0;
    for (const mask of this.wordCoverage) {
      combined |= mask;
    }
    return combined === this.ctx.allCoveredMask;
  }

  private onSameSide(idx1: number, idx2: number): boolean {
    return this.ctx.sideOf[idx1] === this.ctx.sideOf[idx2];
  }

  private addLetter(letter: string, wordNum: number): void {
    this.words[wordNum] += letter;
    this.wordCoverage[wordNum] |= getLetterBit(this.ctx, letter);
  }

  private removeLetter(wordNum: number): void {
    const word = this.words[wordNum];
    this.words[wordNum] = word.substring(0, word.length - 1);
    let mask = 0;
    for (const ch of this.words[wordNum]) {
      mask |= getLetterBit(this.ctx, ch);
    }
    this.wordCoverage[wordNum] = mask;
  }

  private lastLetter(wordNum: number): string {
    const w = this.words[wordNum];
    return w[w.length - 1];
  }

  private alreadyUsed(word: string): boolean {
    return this.words.some((w) => w === word);
  }

  private isValid(letter: string, wordNum: number, charNum: number): boolean {
    if (wordNum === 0 && charNum === 0) return true;

    if (wordNum >= 1 && charNum === 0) {
      return letter === this.lastLetter(wordNum - 1);
    }

    const currWord = this.words[wordNum];
    const newWord = currWord + letter;
    const letterIdx = getLetterIndex(this.ctx, letter);
    const lastIdx = getLetterIndex(this.ctx, currWord[currWord.length - 1]);

    return (
      !this.onSameSide(letterIdx, lastIdx) &&
      !this.alreadyUsed(newWord) &&
      this.dictionary.hasString(newWord)
    );
  }

  private solveRB(wordNum: number, charNum: number, maxWords: number): boolean {
    if (
      this.allLettersUsed() &&
      this.dictionary.hasFullWord(this.words[wordNum]) &&
      this.words[wordNum].length >= 3
    ) {
      return true;
    }

    if (wordNum >= maxWords) return false;

    for (const currLetter of this.ctx.letters) {
      if (this.isValid(currLetter, wordNum, charNum)) {
        this.addLetter(currLetter, wordNum);
        if (this.solveRB(wordNum, charNum + 1, maxWords)) {
          return true;
        }

        const currWord = this.words[wordNum];
        if (currWord.length >= 3 && this.dictionary.hasFullWord(currWord)) {
          this.solvingProcess.push(this.words.filter((w) => w !== ""));
          if (this.solveRB(wordNum + 1, 0, maxWords)) {
            return true;
          }
        }

        this.removeLetter(wordNum);
      }
    }
    return false;
  }

  solve(): { success: boolean; data: string[][] } {
    let maxWords = 1;

    while (maxWords <= MOST_WORDS) {
      if (this.solveRB(0, 0, maxWords)) {
        this.solvingProcess.push(this.words.filter((w) => w !== ""));
        return { success: true, data: this.solvingProcess };
      }
      maxWords++;
    }

    const longest = this.solvingProcess.reduce((a, b) => (a.length > b.length ? a : b), []);
    this.solvingProcess.push(longest);
    return { success: false, data: this.solvingProcess };
  }

  /**
   * Find Best on the CPU, searching whole words instead of letters. Depth d
   * only builds chains of exactly d words, so the first depth that finds any
   * solution has the fewest words, and all of its solutions are ranked.
   */
  static findBestCPU(
    validWords: ValidWord[],
    numWords: number,
    allCoveredMask: number,
  ): { success: boolean; data: string[] } {
    const maxDepth = Math.min(numWords, MOST_WORDS);
    let bestSolution: string[] | null = null;

    // chainIndex[i] lists the valid words (by index) that start with puzzle letter i.
    const chainIndex: number[][] = Array.from({ length: LETTER_COUNT }, () => []);
    for (let i = 0; i < validWords.length; i++) chainIndex[validWords[i].firstLetterIdx].push(i);

    // dead[state] = 1 once we know no `left` more words can finish the puzzle from
    // (last letter, covered letters). The search may repeat words so that this
    // doesn't depend on the path; only chains of distinct words count as solutions.
    const masks = allCoveredMask + 1;
    const dead = new Uint8Array(LETTER_COUNT * masks * (maxDepth + 1));
    const chain: number[] = [];

    const record = (): void => {
      if (new Set(chain).size !== chain.length) return;
      const words = chain.map((i) => validWords[i].word);
      if (!bestSolution || isBetterSolution(words, bestSolution)) bestSolution = words;
    };

    // Returns whether some chain of `left` more words covers every letter.
    const extend = (lastIdx: number, covered: number, left: number): boolean => {
      const state = (lastIdx * masks + covered) * (maxDepth + 1) + left;
      if (dead[state]) return false;

      let found = false;
      for (const i of chainIndex[lastIdx]) {
        const w = validWords[i];
        const mask = covered | w.coverageMask;
        chain.push(i);
        if (left === 1) {
          if (mask === allCoveredMask) {
            found = true;
            record();
          }
        } else if (mask !== allCoveredMask && extend(w.lastLetterIdx, mask, left - 1)) {
          found = true;
        }
        chain.pop();
      }
      if (!found) dead[state] = 1;
      return found;
    };

    for (let depth = 1; depth <= maxDepth && !bestSolution; depth++) {
      for (let i = 0; i < validWords.length; i++) {
        const w = validWords[i];
        chain.push(i);
        if (depth === 1) {
          if (w.coverageMask === allCoveredMask) record();
        } else if (w.coverageMask !== allCoveredMask) {
          extend(w.lastLetterIdx, w.coverageMask, depth - 1);
        }
        chain.pop();
      }
    }

    return {
      success: bestSolution !== null,
      data: bestSolution ?? [],
    };
  }
}
