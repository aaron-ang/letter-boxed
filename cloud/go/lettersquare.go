package lettersquare

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

const (
	mostWords = 5
	wordsFile = "word_list.txt"
)

// Represents the state of a letter-square puzzle,
// and solves it using recursive backtracking.
type LetterSquare struct {
	sides          []string
	letters        []string
	words          []string
	solvingProcess [][]string
	solutions      [][]string
	dictionary     *Dictionary
}

type LetterSquareSolveResponse struct {
	Success bool       `json:"success"`
	Data    [][]string `json:"data"`
}

type LetterSquareFindBestResponse struct {
	Success bool     `json:"success"`
	Data    []string `json:"data"`
}

// Constructor for a puzzle with the specified sides, where each
// side is a string containing the 3 letters from one side of the square.
func NewLetterSquare(sides []string) (*LetterSquare, error) {
	if sides == nil || len(sides) != 4 {
		return nil, fmt.Errorf("sides must be a non-nil slice of 4 strings")
	}

	ls := new(LetterSquare)
	ls.letters = make([]string, 12)
	letterNum := 0
	for _, side := range sides {
		if len(side) != 3 {
			return nil, fmt.Errorf("each side must be a string of 3 letters")
		}
		for _, letter := range side {
			ls.letters[letterNum] = string(letter)
			letterNum++
		}
	}

	ls.sides = sides
	ls.words = make([]string, mostWords)
	ls.solvingProcess = make([][]string, 0)
	ls.solutions = make([][]string, 0)
	d, err := NewDictionary(wordsFile)
	if err != nil {
		return nil, err
	}
	ls.dictionary = d
	return ls, nil
}

// Returns a single-character string containing the last letter in the specified word.
//
// Assumes that word is a String with at least one character.
func lastLetter(word string) string {
	return string(word[len(word)-1])
}

// Returns the string that is formed by removing the last character of the specified word.
//
// Assumes that word is a String with at least one character.
func removeLast(word string) string {
	return word[:len(word)-1]
}

// Adds the specified letter as the next letter in the word at position wordNum in the solution.
// and also updates the solnString accordingly
func (ls *LetterSquare) addLetter(letter string, wordNum int) {
	ls.words[wordNum] += letter
}

// Removes the specified letter from the end of the word at position wordNum in the solution
// and also updates the solnString accordingly
func (ls *LetterSquare) removeLetter(wordNum int) {
	ls.words[wordNum] = removeLast(ls.words[wordNum])
}

// Returns true if the specified word is already one of the words in the solution, and false otherwise.
func (ls *LetterSquare) alreadyUsed(word string) bool {
	for _, usedWord := range ls.words {
		if word == usedWord {
			return true
		}
	}
	return false
}

// Returns true if the single-character strings letter1 and letter2 come from the same side of the puzzle,
// and false otherwise
func (ls *LetterSquare) onSameSide(letter1 string, letter2 string) bool {
	for _, side := range ls.sides {
		if strings.Contains(side, letter1) && strings.Contains(side, letter2) {
			return true
		}
	}
	return false
}

// Returns true if all of the letters in the puzzle are currently being used in the solution to the puzzle,
// and false otherwise
func (ls *LetterSquare) allLettersUsed() bool {
	for _, letter := range ls.letters {
		anyWordHasLetter := false
		for _, word := range ls.words {
			if strings.Contains(word, letter) {
				anyWordHasLetter = true
				break
			}
		}
		if !anyWordHasLetter {
			return false
		}
	}
	return true
}

// Returns true if the specified letter (a one-character string) is a valid choice for the letter in position charNum of the word at
// position wordNum in the soln, and false otherwise.
//
// Since this is a private helper method, we assume that only appropriate values will be passed in.
//
// In particular, we assume that letter is one of the letters of the puzzle.
func (ls *LetterSquare) isValid(letter string, wordNum int, charNum int) bool {
	// First letter of first word
	if wordNum == 0 && charNum == 0 {
		return true
	}
	// First character of any word after the first word
	if wordNum >= 1 && charNum == 0 {
		return letter == lastLetter(ls.words[wordNum-1])
	}
	// All other characters
	currWord := ls.words[wordNum]
	newWord := currWord + letter
	return !ls.onSameSide(letter, lastLetter(currWord)) &&
		!ls.alreadyUsed(newWord) &&
		ls.dictionary.hasString(newWord)
}

// Handles the process of adding one letter to the word at position wordNum as part of a solution with at most maxWords words.
//
// Returns true if a solution has been found, and false otherwise.
//
// Since this is a private helper method, we assume that only appropriate values will be passed in.
func (ls *LetterSquare) solveRB(wordNum int, charNum int, maxWords int) bool {
	// First base case: puzzle solved
	if ls.allLettersUsed() &&
		ls.dictionary.hasFullWord(ls.words[wordNum]) &&
		len(ls.words[wordNum]) >= 3 {
		return true
	}
	// Second base case: wordNum is too big, given the value of maxWords
	if wordNum >= maxWords {
		return false
	}
	// Loop through letters
	for _, currLetter := range ls.letters {
		// Check if valid to add letter
		if ls.isValid(currLetter, wordNum, charNum) {
			// Expand current word in solution by adding one letter
			ls.addLetter(currLetter, wordNum)
			if ls.solveRB(wordNum, charNum+1, maxWords) {
				return true
			}
			currWord := ls.words[wordNum]
			// Possible solutions exhausted, move to next word
			if len(currWord) >= 3 && ls.dictionary.hasFullWord(currWord) {
				ls.solvingProcess = append(ls.solvingProcess, filter(ls.words, notEmptyString))
				if ls.solveRB(wordNum+1, 0, maxWords) {
					return true
				}
			}
			// Recursive call returns to current stack frame: Letter is not viable
			ls.removeLetter(wordNum)
		}
	}
	// Backtrack
	return false
}

// Serves as a wrapper method for solveRB(), which it repeatedly calls
// with a gradually increasing limit for the number of words in the solution.
func (ls *LetterSquare) Solve() LetterSquareSolveResponse {
	maxWords := 1
	for maxWords <= mostWords {
		fmt.Println("Looking for a solution of length", maxWords, "words.")
		if ls.solveRB(0, 0, maxWords) {
			step := filter(ls.words, func(word string) bool {
				return word != ""
			})
			ls.solvingProcess = append(ls.solvingProcess, step)
			return LetterSquareSolveResponse{true, ls.solvingProcess}
		}
		maxWords++
	}
	fmt.Println("No solution found using up to", mostWords, "words.")

	longest := reduce(ls.solvingProcess, func(a []string, b []string) []string {
		if len(a) > len(b) {
			return a
		}
		return b
	}, []string{})
	ls.solvingProcess = append(ls.solvingProcess, longest)
	return LetterSquareSolveResponse{false, ls.solvingProcess}
}

func (ls *LetterSquare) solveRBVoid(wordNum int, charNum int, maxWords int) {
	if ls.allLettersUsed() &&
		ls.dictionary.hasFullWord(ls.words[wordNum]) &&
		len(ls.words[wordNum]) >= 3 {
		ls.solutions = append(ls.solutions, filter(ls.words, notEmptyString))
		return
	}

	if wordNum >= maxWords {
		return
	}

	for _, currLetter := range ls.letters {
		if ls.isValid(currLetter, wordNum, charNum) {
			ls.addLetter(currLetter, wordNum)
			ls.solveRBVoid(wordNum, charNum+1, maxWords)

			currWord := ls.words[wordNum]
			if len(currWord) >= 3 && ls.dictionary.hasFullWord(currWord) {
				ls.solvingProcess = append(ls.solvingProcess, filter(ls.words, notEmptyString))
				ls.solveRBVoid(wordNum+1, 0, maxWords)
			}
			ls.removeLetter(wordNum)
		}
	}
}

// Serves as a wrapper method for solveRBVoid().
//
// All solutions will have at most `numWords` words.
//
// After exhausting all possible solutions, returns the best solution found.
func (ls *LetterSquare) FindBest(numWords int) LetterSquareFindBestResponse {
	solveStart := time.Now()
	ls.solveRBVoid(0, 0, numWords)
	fmt.Printf("It took %v to get all solutions.\n", time.Since(solveStart))

	sortStart := time.Now()
	sort.Slice(ls.solutions, func(i, j int) bool {
		iString, jString := strings.Join(ls.solutions[i], ""), strings.Join(ls.solutions[j], "")
		return len(iString) < len(jString) || strings.Compare(iString, jString) < 0
	})
	fmt.Printf("Sorting took %v.\n", time.Since(sortStart))

	if len(ls.solutions) == 0 {
		return LetterSquareFindBestResponse{false, []string{}}
	}
	return LetterSquareFindBestResponse{true, ls.solutions[0]}
}

func filter(arr []string, f func(string) bool) []string {
	ret := []string{}
	for _, v := range arr {
		if f(v) {
			ret = append(ret, v)
		}
	}
	return ret
}

func notEmptyString(s string) bool {
	return s != ""
}

func reduce(arr [][]string, f func([]string, []string) []string, init []string) []string {
	ret := init
	for _, v := range arr {
		ret = f(ret, v)
	}
	return ret
}
