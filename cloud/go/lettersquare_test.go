package lettersquare

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strconv"
	"testing"
)

func TestNewDictionary(t *testing.T) {
	tests := []struct {
		input string
		want  *Dictionary
		err   bool
	}{
		{wordsFile, &Dictionary{}, false},
		{"nonexistent_file.txt", nil, true},
	}

	for _, test := range tests {
		d, err := NewDictionary(test.input)
		if reflect.TypeOf(d) != reflect.TypeOf(test.want) {
			t.Errorf("NewDictionary() = %v, want %v", d, test.want)
		}
		if (err != nil) != test.err {
			t.Errorf("NewDictionary() err = %v, want %v", err, test.err)
		}
	}
}

type testStringBoolean struct {
	input string
	want  bool
}

func TestDictionaryHasString(t *testing.T) {
	d, _ := NewDictionary(wordsFile)
	tests := []testStringBoolean{
		{"hello", true},
		{"a", true},
		{"", false},
	}

	for _, test := range tests {
		if ans := d.hasString(test.input); ans != test.want {
			t.Errorf("hasString() = %v, want %v", ans, test.want)
		}
	}
}

func TestDictionaryHasFullWord(t *testing.T) {
	d, _ := NewDictionary(wordsFile)
	tests := []testStringBoolean{
		{"hello", true},
		{"a", false},
		{"", false},
	}

	for _, test := range tests {
		if ans := d.hasFullWord(test.input); ans != test.want {
			t.Errorf("hasFullWord() = %v, want %v", ans, test.want)
		}
	}
}

func TestNewLetterSquare(t *testing.T) {
	tests := []struct {
		input []string
		want  *LetterSquare
		err   bool
	}{
		{[]string{"ABC", "DEF", "GHI", "JKL"}, &LetterSquare{}, false},
		{[]string{"ABC", "DEF", "GHI"}, nil, true},
		{[]string{"ABC", "DEF", "GHI", "JKL", "MNO"}, nil, true},
		{nil, nil, true},
		{[]string{"ABCD", "EFG", "HIJ", "KLM"}, nil, true},
	}

	for _, test := range tests {
		ls, err := NewLetterSquare(test.input)
		if reflect.TypeOf(ls) != reflect.TypeOf(test.want) {
			t.Errorf("NewLetterSquare() = %v, want %v", ls, test.want)
		}
		if (err != nil) != test.err {
			t.Errorf("NewLetterSquare() err = %v, want %v", err, test.err)
		}
	}
}

func TestSolveHTTP(t *testing.T) {
	type Body struct {
		input  []string
		length int
	}
	type Response struct {
		words []string
		code  int
	}
	tests := []struct {
		body Body
		want Response
	}{
		{Body{[]string{"IMG", "NAT", "RCL", "OSP"}, 0}, Response{[]string{"MASCOT", "TRIPLING"}, http.StatusOK}},
		{Body{[]string{"IMG", "NAT", "RCL", "OSP"}, 2}, Response{[]string{"ACTORS", "SAMPLING"}, http.StatusOK}},
		{Body{[]string{"IMG", "NAT", "RCL", "OSP"}, 1}, Response{[]string{}, http.StatusOK}},
		{Body{[]string{"ABC", "DEF", "GHI", "JKL"}, 0}, Response{[]string{"LILA", "ALIKE", "ELI", "ILIAD", "DIE"}, http.StatusOK}},
		{Body{[]string{"ABC", "DEF", "GHI"}, 0}, Response{[]string{}, http.StatusBadRequest}},
	}

	for _, tc := range tests {
		tc := tc
		t.Run("", func(t *testing.T) {
			t.Parallel()

			req := httptest.NewRequest("GET", "/", nil)
			q := req.URL.Query()
			for _, letters := range tc.body.input {
				q.Add("input[]", letters)
			}
			if tc.body.length > 0 {
				q.Add("length", strconv.Itoa(tc.body.length))
			}
			req.URL.RawQuery = q.Encode()
			rr := httptest.NewRecorder()
			SolveHTTP(rr, req)

			if rr.Code != tc.want.code {
				t.Errorf("SolveHTTP() code = %v, want %v", rr.Code, tc.want.code)
			}

			if rr.Code == http.StatusOK {
				data, err := gUnzipData(rr.Body.Bytes())
				if err != nil {
					t.Errorf("SolveHTTP() error unzipping response body: %v", err)
				}

				if tc.body.length > 0 { // FindBest
					var res LetterSquareFindBestResponse
					err = json.Unmarshal(data, &res)
					if err != nil {
						t.Errorf("SolveHTTP() error unmarshalling response body: %v", err)
					}
					if !reflect.DeepEqual(res.Data, tc.want.words) {
						t.Errorf("SolveHTTP() solution = %v, want %v", res.Data, tc.want.words)
					}
				} else { // Solve
					var res LetterSquareSolveResponse
					err = json.Unmarshal(data, &res)
					if err != nil {
						t.Errorf("SolveHTTP() error unmarshalling response body: %v", err)
					}
					solution := res.Data[len(res.Data)-1]
					if !reflect.DeepEqual(solution, tc.want.words) {
						t.Errorf("SolveHTTP() solution = %v, want %v", solution, tc.want.words)
					}
				}
			}
		})
	}
}

func gUnzipData(data []byte) (resData []byte, err error) {
	b := bytes.NewBuffer(data)
	var r io.Reader
	r, err = gzip.NewReader(b)
	if err != nil {
		return
	}
	var resB bytes.Buffer
	_, err = resB.ReadFrom(r)
	if err != nil {
		return
	}
	resData = resB.Bytes()
	return
}
