/*
 * Dictionary - represents a collection of English words and word prefixes.
 * For each full word that is added, all prefixes of that word are also included.
 * For example, adding the full word "puzzle" also adds the following
 * prefixes: "p", "pu", "puz", "puzz", and "puzzl".
 *
 */
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
var _Dictionary_instances, _Dictionary_contents, _Dictionary_add;
import fs from "fs";
export default class Dictionary {
    constructor(fileName) {
        _Dictionary_instances.add(this);
        _Dictionary_contents.set(this, void 0);
        __classPrivateFieldSet(this, _Dictionary_contents, new Map(), "f");
        fs.readFile(fileName, "utf8", (err, data) => {
            if (err) {
                console.log(err);
            }
            else {
                data.split("\n").forEach((word) => __classPrivateFieldGet(this, _Dictionary_instances, "m", _Dictionary_add).call(this, word.trim()));
            }
        });
    }
    get contents() {
        return __classPrivateFieldGet(this, _Dictionary_contents, "f");
    }
    /*
     * hasString - returns true if the specified string s is either a word
     * or a prefix of a word in the Dictionary, and false otherwise
     */
    hasString(s) {
        if (s === null || s === "") {
            return false;
        }
        return __classPrivateFieldGet(this, _Dictionary_contents, "f").has(s.toLowerCase());
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
        return __classPrivateFieldGet(this, _Dictionary_contents, "f").has(s) && __classPrivateFieldGet(this, _Dictionary_contents, "f").get(s);
    }
}
_Dictionary_contents = new WeakMap(), _Dictionary_instances = new WeakSet(), _Dictionary_add = function _Dictionary_add(word) {
    let prefix = "";
    for (let i = 0; i < word.length; i++) {
        prefix += word.charAt(i);
        if (!__classPrivateFieldGet(this, _Dictionary_contents, "f").has(prefix)) {
            __classPrivateFieldGet(this, _Dictionary_contents, "f").set(prefix, false);
        }
    }
    // true indicates a full word
    __classPrivateFieldGet(this, _Dictionary_contents, "f").set(prefix, true);
};
