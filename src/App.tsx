import React, { useRef, useState } from "react";
import LetterSquare from "./driver/LetterSquare";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";

function App() {
  const defaultFields = {
    0: "",
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
    7: "",
    8: "",
    9: "",
    10: "",
    11: "",
  };
  let game: LetterSquare;

  const [fields, setFields] = useState<{ [key: number]: string }>(
    defaultFields
  );
  const [solving, setSolving] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const inputRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;
    setFields({ ...fields, [name]: value.toUpperCase() });
    const nextInput = inputRefs.current[parseInt(name) + 1];
    // console.log(nextInput)
    if (nextInput != null && isValid(value) && value !== "") {
      nextInput.querySelector("input")?.focus();
    }
  };

  const handleBackspace = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const name = (e.target as HTMLInputElement).name;
    if (e.key === "Backspace") {
      const prevInput = inputRefs.current[parseInt(name) - 1];
      prevInput?.querySelector("input")?.focus();
    }
  };

  const resetFields = () => {
    setFields(defaultFields);
  };

  const isValid = (c: string) => {
    return !c || c.toLowerCase() !== c.toUpperCase();
  };

  const isFilled = (fields: Record<number, string>) => {
    return !Object.values(fields).includes("");
  };

  const groupLetters = (arr: string[]) => {
    const res: string[] = [];
    let string = "";
    let i = 0;

    while (i < arr.length) {
      for (let j = 0; j < 3; j++) {
        string += arr[i];
        i++;
      }
      res.push(string);
      string = "";
    }

    return res;
  };

  const handleClick = () => {
    if (isFilled(fields)) {
      setSolving(true);
      const input = groupLetters(Object.values(fields));
      game = new LetterSquare(input);
      // console.log(LetterSquare.dictionary.contents)
      setWords(game.words);

      try {
        game.solve();
      } catch (err) {
        console.error(err);
      } finally {
        setSolving(false);
      }
    }
  };

  const isMaxReached = (words: string[]) => {
    const allFullWords = words.every((word) =>
      LetterSquare.dictionary.hasFullWord(word)
    );
    return words.length === LetterSquare.MOST_WORDS && !allFullWords;
  };

  return (
    <>
      <Stack direction="row" spacing={2}>
        {Object.entries(fields).map(([key, value], index) => {
          return (
            <TextField
              sx={{ width: "5em" }}
              key={key}
              inputProps={{
                inputMode: "text",
                pattern: "[a-zA-Z]+",
                maxLength: 1,
              }}
              name={key}
              ref={(el) => (inputRefs.current[index] = el)}
              value={value}
              onChange={handleChange}
              onKeyDown={handleBackspace}
              disabled={solving}
              error={!isValid(value)}
              helperText={!isValid(value) ? "Only alphabets allowed." : ""}
            />
          );
        })}
      </Stack>
      <LoadingButton loading={solving} variant="outlined" onClick={handleClick}>
        Solve
      </LoadingButton>
      <Button color="error" variant="outlined" onClick={resetFields}>
        Reset
      </Button>
      {words.map((word, index) => (
        <p key={index}>{word}</p>
      ))}
      {isMaxReached(words) && (
        <h1>No solution found using up to {LetterSquare.MOST_WORDS} words</h1>
      )}
    </>
  );
}

export default App;
