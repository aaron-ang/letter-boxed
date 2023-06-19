package lettersquare

import (
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
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	r.ParseForm()
	input := r.Form["input[]"]
	driver, err := NewLetterSquare(input)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Invalid input.", http.StatusBadRequest)
		return
	}
	if len(r.Form["length"]) > 0 {
		length, err := strconv.Atoi(r.Form["length"][0])
		if err != nil {
			fmt.Println(err)
			http.Error(w, "Invalid length.", http.StatusBadRequest)
			return
		}
		resultJSON, _ := json.Marshal(driver.FindBest(length))
		fmt.Fprintf(w, "%v", string(resultJSON))
	} else {
		resultJSON, _ := json.Marshal(driver.Solve())
		fmt.Fprintf(w, "%v", string(resultJSON))
	}
}
