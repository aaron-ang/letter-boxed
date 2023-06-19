package lettersquare

import (
	"bufio"
	"os"
	"strings"
)

// Represents a collection of English words and word prefixes.
//
// For each full word that is added, all prefixes of that word are also included.
//
// For example, adding the full word "puzzle" also adds the following
// prefixes: "p", "pu", "puz", "puzz", and "puzzl".
type Dictionary struct {
	contents map[string]bool
}

const gcloudFuncSourceDir = "serverless_function_source_code"

func fixDir() {
	fileInfo, err := os.Stat(gcloudFuncSourceDir)
	if err == nil && fileInfo.IsDir() {
		os.Chdir(gcloudFuncSourceDir)
	}
}

func NewDictionary(filename string) (*Dictionary, error) {
	d := new(Dictionary)
	d.contents = make(map[string]bool)
	fixDir()
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		d.add(strings.TrimSpace(scanner.Text()))
	}

	return d, nil
}

// Adds the specified word and all of its prefixes to the Dictionary.
func (d *Dictionary) add(word string) {
	prefix := ""
	for _, c := range word {
		prefix += string(c)
		if _, ok := d.contents[prefix]; !ok {
			d.contents[prefix] = false
		}
	}
	d.contents[prefix] = true
}

// Returns true if the specified string s is either a word or a prefix of a word in the Dictionary,
// and false otherwise.
func (d *Dictionary) hasString(s string) bool {
	if s == "" {
		return false
	}
	_, ok := d.contents[strings.ToLower(s)]
	return ok
}

// Returns true if the specified string s is a "full word"
// (i.e., a word that can stand on its own) in the Dictionary, and false otherwise.
func (d *Dictionary) hasFullWord(s string) bool {
	if s == "" {
		return false
	}
	fullWord, ok := d.contents[strings.ToLower(s)]
	return ok && fullWord
}
