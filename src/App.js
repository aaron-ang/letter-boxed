import React from "react";
import "./App.css";
import LetterSquare from "./driver/LetterSquare";
function App() {
    return (React.createElement(React.Fragment, null,
        React.createElement("h1", null,
            "No solution found using up to ",
            LetterSquare.MOST_WORDS,
            " words")));
}
export default App;
