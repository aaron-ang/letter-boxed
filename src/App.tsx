import React from "react";
import "./App.css";
import LetterSquare from "./driver/LetterSquare";

function App() {
  return (
    <>
      <h1>No solution found using up to {LetterSquare.MOST_WORDS} words</h1>
    </>
  );
}

export default App;
