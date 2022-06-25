import React, { useState } from "react";
import "./App.css";
import LetterSquare from "./driver/LetterSquare";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import LoadingButton from "@mui/lab/LoadingButton";

function App() {
  const defaultFields: { [key: number]: string } = {
    0: "",
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
    7: "",
    8: "",
  };

  const [fields, setFields] = useState(defaultFields);
  const [solving, setSolving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value.toUpperCase() });
  };

  const isValid = (c: string) => {
    return !c || c.toLowerCase() !== c.toUpperCase();
  };

  const isFilled = (fields: Object) => {
    return !Object.values(fields).includes("")
  }

  const handleClick = () => {
    isFilled(fields) && setSolving(true);
  };

  return (
    <>
      <Stack direction="row" spacing={2}>
        {Object.entries(fields).map(([key, value]) => {
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
              value={value}
              onChange={handleChange}
              disabled = {solving}
              error={!isValid(value)}
              helperText={
                !isValid(value) ? "Only alphabets allowed." : ""
              }
            />
          );
        })}
      </Stack>
      <LoadingButton loading={solving} variant="outlined" onClick={handleClick}>
        Solve
      </LoadingButton>
      <h1>No solution found using up to {LetterSquare.MOST_WORDS} words</h1>
    </>
  );
}

export default App;
