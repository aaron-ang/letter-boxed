package lettersquare

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
)

func init() {
	functions.HTTP("SolveHTTP", SolveHTTP)
}

// SolveHTTP is an HTTP Cloud Function with a request parameter.
func SolveHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	r.ParseForm()
	input := r.Form["input[]"]
	driver, err := NewLetterSquare(input)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Invalid input.", http.StatusBadRequest)
		return
	}

	var res any
	if len(r.Form["length"]) > 0 {
		length, err := strconv.Atoi(r.Form["length"][0])
		if err != nil {
			fmt.Println(err)
			http.Error(w, "Invalid length.", http.StatusBadRequest)
			return
		}
		res = driver.FindBest(length)
	} else {
		res = driver.Solve()
	}

	resJSON, err := json.Marshal(res)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error marshalling to JSON.", http.StatusInternalServerError)
		return
	}

	var b bytes.Buffer
	gz := gzip.NewWriter(&b)
	if _, err := gz.Write(resJSON); err != nil {
		fmt.Println(err)
		http.Error(w, "Error compressing JSON.", http.StatusInternalServerError)
		return
	}
	if err := gz.Close(); err != nil {
		fmt.Println(err)
		http.Error(w, "Error compressing JSON.", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Encoding", "gzip")
	w.Write(b.Bytes())
}
