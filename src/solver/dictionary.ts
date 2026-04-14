import { getLetterIndex, type PuzzleContext, type ValidWord } from "./types";

let cachedInstance: Dictionary | null = null;

export default class Dictionary {
  private contents: Map<string, boolean>;

  private constructor() {
    this.contents = new Map<string, boolean>();
  }

  static async load(url: string): Promise<Dictionary> {
    if (cachedInstance) return cachedInstance;

    const dict = new Dictionary();
    const response = await fetch(url);
    const text = await response.text();
    for (const line of text.split("\n")) {
      const word = line.trim();
      if (word.length > 0) {
        dict.add(word);
      }
    }
    cachedInstance = dict;
    return dict;
  }

  private add(word: string): void {
    let prefix = "";
    for (let i = 0; i < word.length; i++) {
      prefix += word.charAt(i);
      if (!this.contents.has(prefix)) {
        this.contents.set(prefix, false);
      }
    }
    this.contents.set(prefix, true);
  }

  hasString(s: string): boolean {
    if (!s) return false;
    return this.contents.has(s.toLowerCase());
  }

  hasFullWord(s: string): boolean {
    if (!s) return false;
    const lower = s.toLowerCase();
    return this.contents.has(lower) && (this.contents.get(lower) as boolean);
  }

  getValidWords(ctx: PuzzleContext): ValidWord[] {
    const validWords: ValidWord[] = [];

    for (const [key, isFull] of this.contents) {
      if (!isFull || key.length < 3) continue;

      const upper = key.toUpperCase();
      let valid = true;
      let coverageMask = 0;

      for (let i = 0; i < upper.length; i++) {
        const idx = getLetterIndex(ctx, upper[i]);
        if (idx < 0) {
          valid = false;
          break;
        }
        coverageMask |= 1 << idx;

        if (i > 0) {
          const prevIdx = getLetterIndex(ctx, upper[i - 1]);
          if (ctx.sideOf[idx] === ctx.sideOf[prevIdx]) {
            valid = false;
            break;
          }
        }
      }

      if (!valid) continue;

      const firstLetterIdx = getLetterIndex(ctx, upper[0]);
      const lastLetterIdx = getLetterIndex(ctx, upper[upper.length - 1]);

      validWords.push({ word: upper, coverageMask, firstLetterIdx, lastLetterIdx });
    }

    return validWords;
  }
}
