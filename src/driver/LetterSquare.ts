/*
 * LetterSquare - represents the state of a letter-square puzzle,
 * and solves it using recursive backtracking.
 *
 */

import Dictionary from "./Dictionary";

export type LetterSquareResponse = {
  success: boolean;
  data: string[][] | string[];
};

export default class LetterSquare {
  static MOST_WORDS = 5;
  static WORDS_FILE = "word_list.txt";
  static dictionary: Dictionary = new Dictionary(LetterSquare.WORDS_FILE);

  // The sides of the puzzle, given as four strings of length 3.
  private sides: string[];

  // The individual letters in the puzzle.
  // Each element of this array is a single-character string.
  private letters: string[];

  // The words in the solution.
  private words: string[];

  // Words to build visualizer
  private solvingProcess: string[][];

  // To find best solution in solveRBVoid
  private solutions: string[][];

  /*
   * Constructor for a puzzle with the specified sides, where each
   * side is a string containing the 3 letters from one side of the square.
   */
  constructor(sides: string[]) {
    if (sides === null || sides.length !== 4) {
      throw new Error("parameter must be an array of 4 strings");
    }

    this.sides = sides;
    this.letters = new Array(12);
    let letterNum = 0;
    for (let i = 0; i < sides.length; i++) {
      if (sides[i] === null || sides[i].length !== 3) {
        throw new Error("invalid side string: " + sides[i]);
      }

      for (let j = 0; j < 3; j++) {
        this.letters[letterNum] = this.sides[i].substring(j, j + 1);
        letterNum++;
      }
    }

    this.words = [];
    this.solvingProcess = [];
    this.solutions = [];
    for (let i = 0; i < LetterSquare.MOST_WORDS; i++) {
      this.words[i] = "";
    }
  }

  /*
   * lastLetter - returns a single-character string containing
   * the last letter in the specified word
   *
   * assumes that word is a String with at least one character
   */
  private static lastLetter(word: string): string {
    return word.substring(word.length - 1);
  }

  /*
   * removeLast - returns the string that is formed by removing
   * the last character of the specified word
   *
   * assumes that word is a String with at least one character
   */
  private static removeLast(word: string): string {
    return word.substring(0, word.length - 1);
  }

  /*
   * addLetter - adds the specified letter as the next letter
   * in the word at position wordNum in the solution
   * and also updates the solnString accordingly
   */
  private addLetter(letter: string, wordNum: number): void {
    this.words[wordNum] += letter;
  }

  /*
   * removeLetter - removes the specified letter from the end of
   * the word at position wordNum in the solution
   * and also updates the solnString accordingly
   */
  private removeLetter(wordNum: number): void {
    this.words[wordNum] = LetterSquare.removeLast(this.words[wordNum]);
  }

  /*
   * alreadyUsed - returns true if the specified word is already
   * one of the words in the solution, and false otherwise.
   */
  private alreadyUsed(word: string): boolean {
    return this.words.some((w) => w === word);
  }

  /*
   * onSameSide - returns true if the single-character strings
   * letter1 and letter2 come from the same side of the puzzle,
   * and false otherwise
   */
  private onSameSide(letter1: string, letter2: string): boolean {
    return this.sides.some(
      (side) => side.includes(letter1) && side.includes(letter2)
    );
  }

  /*
   * allLettersUsed - returns true if all of the letters in the puzzle
   * are currently being used in the solution to the puzzle,
   * and false otherwise
   */
  private allLettersUsed(): boolean {
    for (const letter of this.letters) {
      let anyWordHasLetter = false;

      for (const w of this.words) {
        if (w.includes(letter)) {
          anyWordHasLetter = true;
          break;
        }
      }

      if (!anyWordHasLetter) {
        return false;
      }
    }

    return true;
  }

  /*
   * isValid - returns true if the specified letter (a one-character string)
   * is a valid choice for the letter in position charNum of the word at
   * position wordNum in the soln, and false otherwise.
   *
   * Since this is a private helper method, we assume that only
   * appropriate values will be passed in.
   * In particular, we assume that letter is one of the letters of the puzzle.
   */
  private isValid(letter: string, wordNum: number, charNum: number): boolean {
    // First letter of first word
    if (wordNum === 0 && charNum === 0) {
      return true;
    }

    // First character of any word after the first word
    if (wordNum >= 1 && charNum === 0) {
      return letter === LetterSquare.lastLetter(this.words[wordNum - 1]);
    }

    // All other characters
    const currWord = this.words[wordNum],
      newWord = currWord + letter;
    return (
      !this.onSameSide(letter, LetterSquare.lastLetter(currWord)) &&
      !this.alreadyUsed(newWord) &&
      LetterSquare.dictionary.hasString(newWord)
    );
  }

  /*
   * solveRB - the key recursive backtracking method.
   * Handles the process of adding one letter to the word at position
   * wordNum as part of a solution with at most maxWords words.
   * Returns true if a solution has been found, and false otherwise.
   *
   * Since this is a private helper method, we assume that only
   * appropriate values will be passed in.
   */
  private solveRB(wordNum: number, charNum: number, maxWords: number): boolean {
    // First base case: puzzle solved
    if (
      this.allLettersUsed() &&
      LetterSquare.dictionary.hasFullWord(this.words[wordNum]) &&
      this.words[wordNum].length >= 3
    ) {
      return true;
    }

    // Second base case: wordNum is too big, given the value of maxWords
    if (wordNum >= maxWords) {
      return false;
    }

    // Loop through letters
    for (const currLetter of this.letters) {
      // Check if valid to add letter
      if (this.isValid(currLetter, wordNum, charNum)) {
        // Expand current word in solution by adding one letter
        this.addLetter(currLetter, wordNum);
        if (this.solveRB(wordNum, charNum + 1, maxWords)) {
          return true;
        }

        const currWord = this.words[wordNum];
        // Possible solutions exhausted, move to next word
        if (
          currWord.length >= 3 &&
          LetterSquare.dictionary.hasFullWord(currWord)
        ) {
          // Append state to solvingProcess
          this.solvingProcess.push(this.words.filter((word) => word !== ""));
          if (this.solveRB(wordNum + 1, 0, maxWords)) {
            return true;
          }
        }

        // Recursive call returns to current stack frame: Letter is not viable
        this.removeLetter(wordNum);
      }
    }
    // Backtrack
    return false;
  }

  /*
   * solve - the method that the client calls to solve the puzzle.
   * Serves as a wrapper method for solveRB(), which it repeatedly calls
   * with a gradually increasing limit for the number of words in the solution.
   */
  solve(): LetterSquareResponse {
    let maxWords = 1;

    while (maxWords <= LetterSquare.MOST_WORDS) {
      console.log("Looking for a solution of length " + maxWords + "...");
      if (this.solveRB(0, 0, maxWords)) {
        this.solvingProcess.push(this.words.filter((word) => word !== ""));
        return { success: true, data: this.solvingProcess };
      }
      maxWords++;
    }

    console.log(
      "No solution found using up to " + LetterSquare.MOST_WORDS + " words."
    );
    // Find the longest in state in the call stack
    const longest = this.solvingProcess.reduce(
      (a, b) => (a.length > b.length ? a : b),
      [] // initialValue
    );
    this.solvingProcess.push(longest);
    return { success: false, data: this.solvingProcess };
  }

  private solveRBVoid(
    wordNum: number,
    charNum: number,
    maxWords: number
  ): void {
    // First base case: puzzle solved
    if (
      this.allLettersUsed() &&
      LetterSquare.dictionary.hasFullWord(this.words[wordNum]) &&
      this.words[wordNum].length >= 3
    ) {
      this.solutions.push(this.words.filter((word) => word !== ""));
      return;
    }

    // Second base case: wordNum is too big, given the value of maxWords
    if (wordNum >= maxWords) {
      return;
    }

    // Loop through letters
    for (const currLetter of this.letters) {
      // Check if valid to add letter
      if (this.isValid(currLetter, wordNum, charNum)) {
        // Expand current word in solution by adding one letter
        this.addLetter(currLetter, wordNum);
        this.solveRBVoid(wordNum, charNum + 1, maxWords);

        const currWord = this.words[wordNum];
        // Possible solutions exhausted, move to next word
        if (
          currWord.length >= 3 &&
          LetterSquare.dictionary.hasFullWord(currWord)
        ) {
          this.solveRBVoid(wordNum + 1, 0, maxWords);
        }

        // Recursive call returns to current stack frame: Letter is not viable
        this.removeLetter(wordNum);
      }
    }
    // Backtrack
    return;
  }

  /*
   * compareSolution - compare function to sort the solutions.
   * Compare solutions based on 1. shortest number of total letters, 2. earliest in alphabetical order
   */
  private compareSolution(a: string[], b: string[]): number {
    const aString = a.join(""),
      bString = b.join("");
    return aString.length - bString.length || aString.localeCompare(bString);
  }

  /*
   * findBest - the method that the client calls after solve() which returns the best solution.
   * Serves as a wrapper method for solveRBVoid().
   * All solutions will have at most `numWords` words.
   * After exhausting all possible solutions, returns the best solution found.
   */
  findBest(numWords: number): LetterSquareResponse {
    const solveStart = Date.now();
    this.solveRBVoid(0, 0, numWords);
    const sortStart = Date.now();
    console.log(
      `It took ${(sortStart - solveStart) / 1000}s to get all solutions.`
    );
    this.solutions.sort(this.compareSolution);
    console.log(`Sorting took ${Date.now() - sortStart}ms.`);
    return {
      success: this.solutions.length > 0,
      data: this.solutions.length === 0 ? [] : this.solutions[0],
    };
  }
}
