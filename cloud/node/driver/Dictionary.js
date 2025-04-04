/*
 * Dictionary - represents a collection of English words and word prefixes.
 * For each full word that is added, all prefixes of that word are also included.
 * For example, adding the full word "puzzle" also adds the following
 * prefixes: "p", "pu", "puz", "puzz", and "puzzl".
 *
 */
import fs from "fs";
export default class Dictionary {
    constructor(fileName) {
        this.contents = new Map();
        fs.readFile(fileName, "utf8", (err, text) => {
            if (err) {
                console.log(err);
            }
            else {
                text.split("\n").forEach((word) => {
                    this.add(word.trim());
                });
            }
        });
    }
    /*
     * add - adds the specified word and all of its prefixes to the Dictionary
     */
    add(word) {
        let prefix = "";
        for (let i = 0; i < word.length; i++) {
            prefix += word.charAt(i);
            if (!this.contents.has(prefix)) {
                this.contents.set(prefix, false);
            }
        }
        // true indicates a full word
        this.contents.set(prefix, true);
    }
    /*
     * hasString - returns true if the specified string s is either a word
     * or a prefix of a word in the Dictionary, and false otherwise
     */
    hasString(s) {
        if (s === null || s === "") {
            return false;
        }
        return this.contents.has(s.toLowerCase());
    }
    /*
     * hasFullWord - returns true if the specified string s is a "full word"
     * (i.e., a word that can stand on its own) in the Dictionary,
     * and false otherwise
     */
    hasFullWord(s) {
        if (s === null || s === "") {
            return false;
        }
        s = s.toLowerCase();
        return this.contents.has(s) && this.contents.get(s);
    }
}
