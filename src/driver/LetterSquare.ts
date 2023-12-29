/*
 * LetterSquare - represents the state of a letter-square puzzle,
 * and solves it using recursive backtracking.
 *
 */

export type LetterSquareResponse = {
  success: boolean;
  data: string[][] | string[];
};

export default class LetterSquare {
  static MOST_WORDS = 5;
}
