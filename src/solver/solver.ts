import type Dictionary from "./dictionary";
import {
  getLetterBit,
  getLetterIndex,
  LETTER_COUNT,
  type PuzzleContext,
  type ValidWord,
} from "./types";

const MOST_WORDS = 5;

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
  private bestSolution: string[] | null;

  constructor(ctx: PuzzleContext, dictionary: Dictionary) {
    this.ctx = ctx;
    this.dictionary = dictionary;
    this.words = Array.from({ length: MOST_WORDS }, () => "");
    this.wordCoverage = new Array(MOST_WORDS).fill(0);
    this.solvingProcess = [];
    this.bestSolution = null;
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

  static findBestCPU(
    validWords: ValidWord[],
    numWords: number,
    allCoveredMask: number,
  ): { success: boolean; data: string[] } {
    let bestSolution: string[] | null = null;

    const isBetter = (words: string[]): boolean =>
      !bestSolution || isBetterSolution(words, bestSolution);

    // chainIndex[i] lists the valid words that start with puzzle letter i.
    const chainIndex: ValidWord[][] = Array.from({ length: LETTER_COUNT }, () => []);
    for (const w of validWords) chainIndex[w.firstLetterIdx].push(w);

    if (numWords >= 1) {
      for (const a of validWords) {
        if (a.coverageMask === allCoveredMask) {
          if (isBetter([a.word])) {
            bestSolution = [a.word];
          }
        }
      }
    }

    if (numWords >= 2 && !bestSolution) {
      for (const a of validWords) {
        const bCandidates = chainIndex[a.lastLetterIdx];
        for (const b of bCandidates) {
          if (a.word === b.word) continue;
          if ((a.coverageMask | b.coverageMask) === allCoveredMask) {
            const words = [a.word, b.word];
            if (isBetter(words)) {
              bestSolution = words;
            }
          }
        }
      }
    }

    if (numWords >= 3 && !bestSolution) {
      for (const a of validWords) {
        const bCandidates = chainIndex[a.lastLetterIdx];
        for (const b of bCandidates) {
          if (a.word === b.word) continue;
          const abMask = a.coverageMask | b.coverageMask;
          if (abMask === allCoveredMask) {
            const words = [a.word, b.word];
            if (isBetter(words)) {
              bestSolution = words;
            }
            continue;
          }
          const cCandidates = chainIndex[b.lastLetterIdx];
          for (const c of cCandidates) {
            if (c.word === a.word || c.word === b.word) continue;
            if ((abMask | c.coverageMask) === allCoveredMask) {
              const words = [a.word, b.word, c.word];
              if (isBetter(words)) {
                bestSolution = words;
              }
            }
          }
        }
      }
    }

    if (numWords >= 4 && !bestSolution) {
      return { success: false, data: [] };
    }

    return {
      success: bestSolution !== null,
      data: bestSolution ?? [],
    };
  }

  findBestBacktracking(numWords: number): { success: boolean; data: string[] } {
    this.bestSolution = null;
    this.words = Array.from({ length: MOST_WORDS }, () => "");
    this.wordCoverage = new Array(MOST_WORDS).fill(0);
    this.solveRBFull(0, 0, numWords);
    return {
      success: this.bestSolution !== null,
      data: this.bestSolution ?? [],
    };
  }

  private solveRBFull(wordNum: number, charNum: number, maxWords: number): number {
    let numSolutions = 0;

    if (
      this.allLettersUsed() &&
      this.dictionary.hasFullWord(this.words[wordNum]) &&
      this.words[wordNum].length >= 3
    ) {
      const currentSolution = this.words.filter((w) => w !== "");
      if (!this.bestSolution || isBetterSolution(currentSolution, this.bestSolution)) {
        this.bestSolution = [...currentSolution];
      }
      return 1;
    }

    if (wordNum >= maxWords) return 0;

    for (const currLetter of this.ctx.letters) {
      if (this.isValid(currLetter, wordNum, charNum)) {
        this.addLetter(currLetter, wordNum);
        numSolutions += this.solveRBFull(wordNum, charNum + 1, maxWords);

        const currWord = this.words[wordNum];
        if (currWord.length >= 3 && this.dictionary.hasFullWord(currWord)) {
          numSolutions += this.solveRBFull(wordNum + 1, 0, maxWords);
        }

        this.removeLetter(wordNum);
      }
    }
    return numSolutions;
  }
}
