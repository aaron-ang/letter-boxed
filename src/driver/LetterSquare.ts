/*
 * LetterSquare - represents the state of a letter-square puzzle,
 * and solves it using recursive backtracking.
 *
 */

type LetterSquareResponse = {
  success: boolean;
  data: string[][] | string[];
};

export interface SolveResponse extends LetterSquareResponse {
  data: string[][];
}

export interface FindBestResponse extends LetterSquareResponse {
  data: string[];
}

export const MOST_WORDS = 5;
