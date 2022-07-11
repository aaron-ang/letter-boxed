import React from "react";
import { useRef, useState } from "react";
import LetterSquare from "./driver/LetterSquare";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import LinearProgressWithLabel from "./components/LinearProgressWithLabel";

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

  const [fields, setFields] = useState<{ [key: number]: string }>(
    defaultFields
  );
  const [disabled, setDisabled] = useState<boolean[]>([]); // To allow changing of TextField state while visualizing
  const [focus, setFocus] = useState<boolean[]>([]); // To allow changing of TextField state while visualizing
  const [solving, setSolving] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [visualize, setVisualize] = useState(false);
  const [progress, setProgress] = React.useState(0);
  const [isSuccess, setIsSuccess] = React.useState(true);
  const inputRefs = useRef<Array<HTMLDivElement | null>>([]);
  const inputProps = {
    inputMode: "text" as "text",
    pattern: "[a-zA-Z]+",
    maxLength: 1,
    style: {
      textAlign: "center" as "center",
    },
  };
  const sx = { width: "4em" };
  const delay = 5;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-z]/gi, "");
    const name = e.target.name;
    setFields({ ...fields, [name]: value.toUpperCase() });
    const nextInput = inputRefs.current[parseInt(name) + 1];
    if (nextInput != null && value !== "") {
      nextInput.querySelector("input")?.focus();
    }
  };

  const handleBackspace = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (e.key === "Backspace" && target.value === "") {
      const prevInput = inputRefs.current[parseInt(target.name) - 1];
      prevInput?.querySelector("input")?.focus();
    }
  };

  const resetFields = () => {
    setFields(defaultFields);
    setSolving(false);
    setWords([]);
    setProgress(0);
    setIsSuccess(true);
    setFocus([]);
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

  const showProgress = async (progressArr: string[][]) => {
    setProgress(0);

    progressArr.at(-1)![0] === "fail"
      ? setIsSuccess(false)
      : setIsSuccess(true);

    const updateFocus = (stateArr: string[], focusArr: boolean[]) => {
      stateArr.forEach((word) => {
        const charArray = [...word];
        charArray.forEach((c) => {
          const index = fieldsArr.indexOf(c);
          if (index !== -1) {
            focusArr[index] = true;
          }
        });
      });
    };

    const fieldsArr = Object.values(fields);
    if (visualize) {
      for (const state of progressArr.slice(0, -1)) {
        setWords(state);
        setProgress((prevState) => prevState + (1 / progressArr.length) * 100);
        // If char in textfield is used, make it focused
        const focusArr: boolean[] = Array(12).fill(false);
        updateFocus(state, focusArr);
        // If textfield is not focused, make it disabled
        const disabledArr: boolean[] = [];
        focusArr.forEach((val, i) => {
          if (!val) {
            disabledArr[i] = true;
          }
        });
        setFocus(focusArr);
        setDisabled(disabledArr);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } else {
      const lastSolution = progressArr.at(-2)!;
      const focusArr: boolean[] = [];
      updateFocus(lastSolution, focusArr);
      setFocus(focusArr);
      setWords(lastSolution);
    }

    setDisabled([])
    setSolving(false);
  };

  const handleClick = () => {
    if (isFilled(fields)) {
      setSolving(true);
      const input = groupLetters(Object.values(fields));
      console.log(`input: ${input}`);
      try {
        const progress = new LetterSquare(input).solve();
        console.log(progress.at(-1));
        showProgress(progress);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleVizChange = () => {
    setVisualize((prevState) => !prevState);
  };

  return (
    <Box
      sx={{
        paddingTop: "5em",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Stack direction="row" spacing={2}>
        {Object.entries(fields)
          .slice(0, 3)
          .map(([key, value]) => (
            <TextField
              sx={sx}
              key={key}
              inputProps={inputProps}
              name={key}
              ref={(el) => (inputRefs.current[parseInt(key)] = el)}
              value={value}
              onChange={handleChange}
              onKeyDown={handleBackspace}
              focused={focus[parseInt(key)]}
              disabled={disabled[parseInt(key)]}
            />
          ))}
      </Stack>
      <Grid container justifyContent="center" spacing={30}>
        <Grid item>
          <Stack direction="column" spacing={2}>
            {Object.entries(fields)
              .slice(3, 6)
              .map(([key, value]) => (
                <TextField
                  sx={sx}
                  key={key}
                  inputProps={inputProps}
                  name={key}
                  ref={(el) => (inputRefs.current[parseInt(key)] = el)}
                  value={value}
                  onChange={handleChange}
                  onKeyDown={handleBackspace}
                  focused={focus[parseInt(key)]}
                  disabled={disabled[parseInt(key)]}
                />
              ))}
          </Stack>
        </Grid>
        <Grid item>
          <Stack direction="column" spacing={2}>
            {Object.entries(fields)
              .slice(6, 9)
              .map(([key, value]) => (
                <TextField
                  sx={sx}
                  key={key}
                  inputProps={inputProps}
                  name={key}
                  ref={(el) => (inputRefs.current[parseInt(key)] = el)}
                  value={value}
                  onChange={handleChange}
                  onKeyDown={handleBackspace}
                  focused={focus[parseInt(key)]}
                  disabled={disabled[parseInt(key)]}
                />
              ))}
          </Stack>
        </Grid>
      </Grid>
      <Stack direction="row" spacing={2}>
        {Object.entries(fields)
          .slice(9)
          .map(([key, value]) => (
            <TextField
              sx={sx}
              key={key}
              inputProps={inputProps}
              name={key}
              ref={(el) => (inputRefs.current[parseInt(key)] = el)}
              value={value}
              onChange={handleChange}
              onKeyDown={handleBackspace}
              focused={focus[parseInt(key)]}
              disabled={disabled[parseInt(key)]}
            />
          ))}
      </Stack>

      <Stack direction="row" spacing={2} margin={2}>
        <Button color="error" variant="contained" onClick={resetFields}>
          Reset
        </Button>
        <LoadingButton
          loading={solving}
          variant="contained"
          onClick={handleClick}
        >
          Solve
        </LoadingButton>
        <FormControlLabel
          disabled={solving}
          control={<Checkbox checked={visualize} onChange={handleVizChange} />}
          label="Visualize"
        />
      </Stack>
      <LinearProgressWithLabel value={progress} />
      <>
        {words?.map((word, index) => (
          <p key={index}>{word}</p>
        ))}
        {!solving && !isSuccess && (
          <h1>No solution found using up to {LetterSquare.MOST_WORDS} words</h1>
        )}
      </>
    </Box>
  );
}

export default App;
