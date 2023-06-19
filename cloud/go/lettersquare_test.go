package lettersquare

import (
	"net/http/httptest"
	"strconv"
	"testing"
)

func TestNewDictionary(t *testing.T) {
	d, err := NewDictionary(wordsFile)
	if d == nil {
		t.Errorf("NewDictionary() = nil")
	}
	if err != nil {
		t.Errorf("NewDictionary() err = %v", err)
	}

	d, err = NewDictionary("nonexistent_file.txt")
	if d != nil {
		t.Errorf("NewDictionary() = %v, want nil", d)
	}
	if err == nil {
		t.Errorf("NewDictionary() err = nil, want error")
	}
}

func TestDictionaryHasString(t *testing.T) {
	d, _ := NewDictionary(wordsFile)

	if !d.hasString("hello") {
		t.Errorf("hasString() = false, want true")
	}
	if !d.hasString("a") {
		t.Errorf("hasString() = true, want false")
	}
	if d.hasString("") {
		t.Errorf("hasFullWord() = true, want false")
	}
}

func TestDictionaryHasFullWord(t *testing.T) {
	d, _ := NewDictionary(wordsFile)

	if !d.hasFullWord("hello") {
		t.Errorf("hasFullWord() = false, want true")
	}
	if d.hasFullWord("a") {
		t.Errorf("hasFullWord() = true, want false")
	}
	if d.hasFullWord("") {
		t.Errorf("hasFullWord() = true, want false")
	}
}

func TestNewLetterSquare(t *testing.T) {
	ls, _ := NewLetterSquare([]string{"ABC", "DEF", "GHI", "JKL"})
	if ls == nil {
		t.Errorf("NewLetterSquare() = nil")
	}

	ls, err := NewLetterSquare([]string{"ABC", "DEF", "GHI"})
	if ls != nil {
		t.Errorf("NewLetterSquare() = %v, want nil", ls)
	}
	if err == nil {
		t.Errorf("NewLetterSquare() err = nil, want error")
	}

	ls, err = NewLetterSquare([]string{"ABC", "DEF", "GHI", "JKL", "MNO"})
	if ls != nil {
		t.Errorf("NewLetterSquare() = %v, want nil", ls)
	}
	if err == nil {
		t.Errorf("NewLetterSquare() err = nil, want error")
	}

	ls, err = NewLetterSquare(nil)
	if ls != nil {
		t.Errorf("NewLetterSquare() = %v, want nil", ls)
	}
	if err == nil {
		t.Errorf("NewLetterSquare() err = nil, want error")
	}

	ls, err = NewLetterSquare([]string{"ABCD", "EFG", "HIJ", "KLM"})
	if ls != nil {
		t.Errorf("NewLetterSquare() = %v, want nil", ls)
	}
	if err == nil {
		t.Errorf("NewLetterSquare() err = nil, want error")
	}
}

func TestSolveHTTP(t *testing.T) {
	type Body struct {
		input  []string
		length int
	}
	tests := []struct {
		body Body
		want []string
	}{
		{body: Body{[]string{"SRG", "MDH", "IOL", "ENP"}, 0}, want: []string{"MORPHS", "SHIELDING"}},
		{body: Body{[]string{"SRG", "MDH", "IOL", "ENP"}, 2}, want: []string{"MORPHS", "SINGLED"}},
		{body: Body{[]string{"ABC", "DEF", "GHI", "JKL"}, 0}, want: []string{""}},
	}

	for _, test := range tests {
		req := httptest.NewRequest("GET", "/", nil)
		q := req.URL.Query()
		for _, row := range test.body.input {
			q.Add("input", row)
		}
		if test.body.length > 0 {
			q.Add("length", strconv.Itoa(test.body.length))
		}
		req.URL.RawQuery = q.Encode()
		rr := httptest.NewRecorder()
		SolveHTTP(rr, req)
		if status := rr.Code; status != 200 {
			t.Errorf("SolveHTTP() status = %v, want 200", status)
		}
		// if rr.Body.String() != test.want[0] && rr.Body.String() != test.want[1] {
		// 	t.Errorf("SolveHTTP() = %v, want %v", rr.Body.String(), test.want)
		// }
	}
}
