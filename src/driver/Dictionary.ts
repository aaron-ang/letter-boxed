export default class Dictionary {
  #contents: Map<string, boolean>;

  constructor(fileName: string) {
    this.#contents = new Map<string, boolean>();
    const reader = new FileReader();
    let text = "";
    reader.addEventListener(
      "load",
      () => {
        // this will then display a text file
        text = reader.result as string;
      },
      false
    );
    const textByLine = text.split("\n");
    textByLine.forEach((word) => this.#add(word));
  }

  /*
   * add - adds the specified word and all of its prefixes to the Dictionary
   */
  #add(word: string): void {
    let prefix = "";
    for (let i = 0; i < word.length; i++) {
      prefix += word.charAt(i);
      if (!this.#contents.has(prefix)) {
        this.#contents.set(prefix, false);
      }
    }

    // true indicates a full word
    this.#contents.set(prefix, true);
  }

  /*
   * hasString - returns true if the specified string s is either a word
   * or a prefix of a word in the Dictionary, and false otherwise
   */
  hasString(s: string): boolean {
    if (s == null || s === "") {
      return false;
    } else {
      return this.#contents.has(s.toLowerCase());
    }
  }

  /*
   * hasFullWord - returns true if the specified string s is a "full word"
   * (i.e., a word that can stand on its own) in the Dictionary,
   * and false otherwise
   */
  hasFullWord(s: string): boolean {
    if (s == null || s === "") {
      return false;
    } else {
      s = s.toLowerCase();
      return this.#contents.has(s) && (this.#contents.get(s) as boolean);
    }
  }
}
