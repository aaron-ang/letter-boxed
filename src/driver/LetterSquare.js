"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _LetterSquare_instances, _LetterSquare_sides, _LetterSquare_letters, _LetterSquare_words, _LetterSquare_addLetter, _LetterSquare_removeLetter, _LetterSquare_alreadyUsed, _LetterSquare_onSameSide, _LetterSquare_allLettersUsed, _LetterSquare_isValid, _LetterSquare_solveRB;
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * LetterSquare - represents the state of a letter-square puzzle,
 * and solves it using recursive backtracking.
 *
 */
const Dictionary_1 = __importDefault(require("./Dictionary"));
class LetterSquare {
    /*
     * Constructor for a puzzle with the specified sides, where each
     * side is a string containing the 3 letters from one side of the square.
     */
    constructor(sides) {
        _LetterSquare_instances.add(this);
        // The sides of the puzzle, given as four strings of length 3.
        _LetterSquare_sides.set(this, void 0);
        // The individual letters in the puzzle.
        // Each element of this array is a single-character string.
        _LetterSquare_letters.set(this, void 0);
        // The words in the solution.
        _LetterSquare_words.set(this, void 0);
        if (sides == null || sides.length !== 4) {
            throw new Error("parameter must be an array of 4 strings");
        }
        __classPrivateFieldSet(this, _LetterSquare_sides, sides, "f");
        __classPrivateFieldSet(this, _LetterSquare_letters, new Array(12), "f");
        let letterNum = 0;
        for (let i = 0; i < sides.length; i++) {
            if (sides[i] == null || sides[i].length !== 3) {
                throw new Error("invalid side string: " + sides[i]);
            }
            for (let j = 0; j < 3; j++) {
                __classPrivateFieldGet(this, _LetterSquare_letters, "f")[letterNum] = __classPrivateFieldGet(this, _LetterSquare_sides, "f")[i].substring(j, j + 1);
                letterNum++;
            }
        }
        __classPrivateFieldSet(this, _LetterSquare_words, [], "f");
        for (let i = 0; i < LetterSquare.MOST_WORDS; i++) {
            __classPrivateFieldGet(this, _LetterSquare_words, "f")[i] = "";
        }
    }
    get words() {
        return __classPrivateFieldGet(this, _LetterSquare_words, "f");
    }
    /*
     * lastLetter - returns a single-character string containing
     * the last letter in the specified word
     *
     * assumes that word is a String with at least one character
     */
    static lastLetter(word) {
        return word.substring(word.length - 1);
    }
    /*
     * removeLast - returns the string that is formed by removing
     * the last character of the specified word
     *
     * assumes that word is a String with at least one character
     */
    static removeLast(word) {
        return word.substring(0, word.length - 1);
    }
    /*
     * solve - the method that the client calls to solve the puzzle.
     * Serves as a wrapper method for solveRB(), which it repeatedly calls
     * with a gradually increasing limit for the number of words in the solution.
     */
    solve() {
        let maxWords = 1;
        while (maxWords <= LetterSquare.MOST_WORDS) {
            console.log("Looking for a solution of length " + maxWords + "...");
            if (__classPrivateFieldGet(this, _LetterSquare_instances, "m", _LetterSquare_solveRB).call(this, 0, 0, maxWords)) {
                return;
            }
            maxWords++;
        }
        console.log("No solution found using up to " + LetterSquare.MOST_WORDS + " words.");
    }
}
exports.default = LetterSquare;
_LetterSquare_sides = new WeakMap(), _LetterSquare_letters = new WeakMap(), _LetterSquare_words = new WeakMap(), _LetterSquare_instances = new WeakSet(), _LetterSquare_addLetter = function _LetterSquare_addLetter(letter, wordNum) {
    __classPrivateFieldGet(this, _LetterSquare_words, "f")[wordNum] += letter;
}, _LetterSquare_removeLetter = function _LetterSquare_removeLetter(wordNum) {
    __classPrivateFieldGet(this, _LetterSquare_words, "f")[wordNum] = LetterSquare.removeLast(__classPrivateFieldGet(this, _LetterSquare_words, "f")[wordNum]);
}, _LetterSquare_alreadyUsed = function _LetterSquare_alreadyUsed(word) {
    for (const w in __classPrivateFieldGet(this, _LetterSquare_words, "f")) {
        if (w === word) {
            return true;
        }
    }
    return false;
}, _LetterSquare_onSameSide = function _LetterSquare_onSameSide(letter1, letter2) {
    for (const side in __classPrivateFieldGet(this, _LetterSquare_sides, "f")) {
        if (side.includes(letter1) && side.includes(letter2)) {
            return true;
        }
    }
    return false;
}, _LetterSquare_allLettersUsed = function _LetterSquare_allLettersUsed() {
    for (const letter in __classPrivateFieldGet(this, _LetterSquare_letters, "f")) {
        let anyWordHasLetter = false;
        for (const w in __classPrivateFieldGet(this, _LetterSquare_words, "f")) {
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
}, _LetterSquare_isValid = function _LetterSquare_isValid(letter, wordNum, charNum) {
    // First letter of first word
    if (wordNum === 0 && charNum === 0) {
        return true;
    }
    // First character of any word after the first word
    if (wordNum >= 1 && charNum === 0) {
        return letter === LetterSquare.lastLetter(__classPrivateFieldGet(this, _LetterSquare_words, "f")[wordNum - 1]);
    }
    // All other characters
    const currWord = __classPrivateFieldGet(this, _LetterSquare_words, "f")[wordNum];
    const newWord = currWord + letter;
    return (!__classPrivateFieldGet(this, _LetterSquare_instances, "m", _LetterSquare_onSameSide).call(this, letter, LetterSquare.lastLetter(currWord)) &&
        !__classPrivateFieldGet(this, _LetterSquare_instances, "m", _LetterSquare_alreadyUsed).call(this, newWord) &&
        LetterSquare.dictionary.hasString(newWord));
}, _LetterSquare_solveRB = function _LetterSquare_solveRB(wordNum, charNum, maxWords) {
    // First base case: puzzle solved
    if (__classPrivateFieldGet(this, _LetterSquare_instances, "m", _LetterSquare_allLettersUsed).call(this) &&
        LetterSquare.dictionary.hasFullWord(__classPrivateFieldGet(this, _LetterSquare_words, "f")[wordNum])) {
        // TODO: Add code to handle solution found
        return true;
    }
    // Second base case: wordNum is too big, given the value of maxWords
    if (wordNum >= maxWords) {
        return false;
    }
    // Loop through letters
    for (let i = 0; i < __classPrivateFieldGet(this, _LetterSquare_letters, "f").length; i++) {
        const currLetter = __classPrivateFieldGet(this, _LetterSquare_letters, "f")[i];
        // Check if valid to add letter
        if (__classPrivateFieldGet(this, _LetterSquare_instances, "m", _LetterSquare_isValid).call(this, currLetter, wordNum, charNum)) {
            // Expand current word in solution by adding one letter (delay 300ms)
            setTimeout(() => __classPrivateFieldGet(this, _LetterSquare_instances, "m", _LetterSquare_addLetter).call(this, currLetter, wordNum), 300);
            if (__classPrivateFieldGet(this, _LetterSquare_instances, "m", _LetterSquare_solveRB).call(this, wordNum, charNum + 1, maxWords)) {
                return true;
            }
            const currWord = __classPrivateFieldGet(this, _LetterSquare_words, "f")[wordNum];
            // Possible solutions exhausted, move to next word
            if (currWord.length >= 3 &&
                LetterSquare.dictionary.hasFullWord(currWord) &&
                __classPrivateFieldGet(this, _LetterSquare_instances, "m", _LetterSquare_solveRB).call(this, wordNum + 1, 0, maxWords)) {
                return true;
            }
            // Recursive call returns to current stack frame: Letter is not viable
            __classPrivateFieldGet(this, _LetterSquare_instances, "m", _LetterSquare_removeLetter).call(this, wordNum);
        }
    }
    // Backtrack
    return false;
};
LetterSquare.MOST_WORDS = 10;
LetterSquare.WORDS_FILE = "word_list.txt";
LetterSquare.dictionary = new Dictionary_1.default(LetterSquare.WORDS_FILE);
