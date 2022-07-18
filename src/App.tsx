import React, { useRef, useState } from "react";
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
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

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
  const inputProps = {
    inputMode: "text" as "text",
    pattern: "[a-zA-Z]+",
    maxLength: 1,
    style: {
      textAlign: "center" as "center",
    },
    "aria-label": "input",
  };
  const sx = { width: "4em" };
  const marks = [
    { value: 1, label: "1" },
    { value: 5, label: "5" },
    { value: 10, label: "10" },
    { value: 25, label: "25" },
  ];

  const [fields, setFields] = useState<Record<number, string>>(defaultFields);
  const [disabled, setDisabled] = useState<boolean[]>([]); // To allow changing of TextField state while visualizing
  const [focus, setFocus] = useState<boolean[]>([]); // To allow changing of TextField state while visualizing
  const [solving, setSolving] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [visualize, setVisualize] = useState(false);
  const [progress, setProgress] = React.useState(0);
  const [isSuccess, setIsSuccess] = React.useState(true);
  const [delay, setDelay] = React.useState(5);
  const inputRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [prevInput, setPrevInput] = useState<string[]>([]);
  const [prevProcess, setprevProcess] = useState<string[][]>([]);

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
    location.reload(); // Only way to cancel promise chain
  };

  const handleDelayChange = (event: SelectChangeEvent) => {
    setDelay(parseInt(event.target.value));
  };

  const handleVizChange = () => {
    setVisualize((prevState) => !prevState);
  };

  const handleClick = async () => {
    if (isFilled(fields)) {
      const input = groupLetters(Object.values(fields));
      console.log(`input: ${input}`);

      setSolving(true);
      const driver = new LetterSquare(input);
      try {
        const process =
          JSON.stringify(input) === JSON.stringify(prevInput)
            ? prevProcess
            : // Set timeout to display loading animation
              (await new Promise((resolve) => setTimeout(resolve, 500)),
              await driver.solve());
        console.log(process.at(-1));
        await updateBoard(process);
        setprevProcess(process);
        process.at(-1)![0] === "success"
          ? setIsSuccess(true)
          : setIsSuccess(false);
      } catch (err) {
        alert(err);
      } finally {
        setPrevInput(input);
        setSolving(false);
      }
    }
  };

  const generateRandom = () => {
    setWords([]);
    setProgress(0);
    setIsSuccess(true);
    setFocus([]);
    const keys = [...Array(12).keys()];
    const charSet = new Set<string>();
    // Source: https://www3.nd.edu/~busiforc/handouts/cryptography/letterfrequencies.html
    const commonChars = "ETAINOSHRDLUCMFYW";
    while (charSet.size < keys.length) {
      charSet.add(
        commonChars.charAt(Math.floor(Math.random() * commonChars.length))
      );
    }
    const charArray = [...charSet];
    const result: Record<number, string> = {};
    keys.forEach((key) => (result[key] = charArray[key]));
    setFields(result);
  };

  const getPuzzle = () => {
    // setWords([]);
    // setProgress(0);
    // setIsSuccess(true);
    // setFocus([]);
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

  const updateBoard = async (progressArr: string[][]) => {
    setProgress(0);
    const fieldsArr = Object.values(fields); // Get current characters in fields state

    const updateFocus = (stateArr: string[], focusArr: boolean[]) => {
      stateArr?.forEach((word) => {
        const charArray = [...word];
        charArray.forEach((c) => {
          const index = fieldsArr.indexOf(c);
          if (index !== -1) {
            focusArr[index] = true;
          }
        });
      });
    };

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
      const lastSolution = progressArr.at(-2) ?? [];
      const focusArr: boolean[] = [];
      updateFocus(lastSolution, focusArr);
      setFocus(focusArr);
      setWords(lastSolution);
    }
    setDisabled([]);
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

      <Grid container justifyContent="center">
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
          <Stack direction="column" spacing={5} m={5}>
            <Button
              variant="outlined"
              color="secondary"
              disabled={solving}
              onClick={generateRandom}
            >
              Random Puzzle
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() =>
                window.open("https://www.nytimes.com/puzzles/letter-boxed")
              }
            >
              Visit NYT Site
            </Button>
            {/* <Button
              variant="outlined"
              color="secondary"
              disabled={solving}
              onClick={getPuzzle}
            >
              Today's Puzzle
            </Button> */}
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
      </Stack>
      <Stack direction="row" spacing={2}>
        <FormControlLabel
          disabled={solving}
          control={<Checkbox checked={visualize} onChange={handleVizChange} />}
          label="Visualize"
        />
        <FormControl sx={{ minWidth: 80 }} disabled={!visualize || solving}>
          <InputLabel id="delay-label">Delay(ms)</InputLabel>
          <Select
            value={delay.toString()}
            labelId="delay-label"
            label="Delay(ms)"
            onChange={handleDelayChange}
          >
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <LinearProgressWithLabel value={progress} />
      {words?.map((word, index) => (
        <p key={index}>{word}</p>
      ))}
      {!solving && !isSuccess && (
        <h2>No solution found using up to {LetterSquare.MOST_WORDS} words</h2>
      )}
    </Box>
  );
}

export default App;
