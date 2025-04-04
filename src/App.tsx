import { useRef, useState } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Slider from "@mui/material/Slider";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { createTheme, responsiveFontSizes, ThemeProvider } from "@mui/material";

import {
  SolveResponse,
  FindBestResponse,
  MOST_WORDS,
} from "./driver/LetterSquare";
import MyAppBar from "./components/MyAppBar";
import MyTextField from "./components/MyTextField";
import LinearProgressWithLabel from "./components/LinearProgressWithLabel";

export default function App() {
  const CLOUD_FUNCTION_URL =
    process.env.CLOUD_FUNCTION_URL_PROD || "http://localhost:8080/";

  const defaultFields = { ...Array(12).fill("") };

  const [fields, setFields] = useState<Record<number, string>>(defaultFields),
    [solving, setSolving] = useState(false),
    [solution, setSolution] = useState<string[]>([]),
    [visualize, setVisualize] = useState(false),
    [progress, setProgress] = useState(0),
    [isSuccess, setIsSuccess] = useState(true),
    [delay, setDelay] = useState(5),
    [prevInput, setPrevInput] = useState<string[]>([]),
    [prevProcess, setPrevProcess] = useState<string[][]>([]),
    [bestSolution, setBestSolution] = useState<string[]>([]);

  // To allow TextField state to vary while visualizing
  const [disabledFields, setDisabledFields] = useState<boolean[]>([]),
    [focusFields, setFocusFields] = useState<boolean[]>([]);

  const inputRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-z]/gi, ""),
      name = e.target.name,
      nextInput = inputRefs.current[parseInt(name) + 1];
    setFields({ ...fields, [name]: value.toUpperCase() });
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

  const handleSliderChange = (event: Event, value: number | number[]) => {
    const step = prevProcess[value as number],
      focusArr: boolean[] = Array(12).fill(false),
      disabledArr: boolean[] = Array(12).fill(false);
    updateFocus(step, focusArr);
    focusArr.forEach((val, i) => {
      if (!val) {
        disabledArr[i] = true;
      }
    });
    setFocusFields(focusArr);
    setDisabledFields(disabledArr);
    setSolution(step);
  };

  async function getSolution(input: string[]): Promise<SolveResponse>;
  async function getSolution(
    input: string[],
    length: number
  ): Promise<FindBestResponse>;
  async function getSolution(input: string[], length?: number) {
    const res = await axios.get(CLOUD_FUNCTION_URL!, {
      params: { input, length },
    });
    return res.data;
  }

  const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const handleSolve = async () => {
    try {
      setSolution([]);
      setBestSolution([]);
      const input = groupLetters(fields);
      console.log(`input: ${input}`);
      setSolving(true);

      let process: string[][], success: boolean;

      // check cache
      if (input.every((v, i) => v === prevInput[i])) {
        process = prevProcess;
        success = true;
      } else {
        const res = await getSolution(input);
        process = res.data;
        success = res.success;
        console.log(`response: ${success ? "success" : "failure"}`);
      }

      await updateBoard(process);
      setPrevProcess(process);
      setIsSuccess(success);
      setPrevInput(input);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 504) {
          alert("Request timed out. Please try again.");
        } else {
          alert(err.message);
        }
      } else {
        console.log(err);
      }
    } finally {
      setSolving(false);
    }
  };

  const findBest = async () => {
    try {
      if (bestSolution.length === 0) {
        console.log(
          `Looking for the best solution of length ${solution.length}...`
        );
        setSolving(true);
        const res = await getSolution(prevInput, solution.length);
        setBestSolution(res.data);
      }
    } catch (err) {
      alert(err);
    } finally {
      setSolving(false);
    }
  };

  const generateRandom = () => {
    setSolution([]);
    setPrevInput([]);
    setPrevProcess([]);
    setBestSolution([]);
    setProgress(0);
    setIsSuccess(true);
    setFocusFields([]);
    setDisabledFields([]);

    const keys = [...Array(12).keys()],
      charSet = new Set<string>(),
      commonChars = "EARIOTNSLCUDPMHGB"; // Source: https://www3.nd.edu/~busiforc/handouts/cryptography/letterfrequencies.html

    while (charSet.size < keys.length) {
      charSet.add(
        commonChars.charAt(Math.floor(Math.random() * commonChars.length))
      );
    }
    const charArray = [...charSet],
      result: Record<number, string> = {};
    keys.forEach((key) => (result[key] = charArray[key]));
    setFields(result);
  };

  const groupLetters = (fields: Record<number, string>) => {
    if (Object.values(fields).includes("")) {
      throw new Error("Please fill out all fields");
    }

    const arr = Object.values(fields),
      res: string[] = [];

    let string = "",
      i = 0;

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

    if (visualize) {
      await processVisualization(progressArr);
    } else {
      const solution = progressArr[progressArr.length - 1] ?? [],
        focusArr: boolean[] = [];
      updateFocus(solution, focusArr);
      setFocusFields(focusArr);
      setSolution(solution);
    }
    setDisabledFields([]);
  };

  const processVisualization = async (progressArr: string[][]) => {
    for (const state of progressArr) {
      setSolution(state);
      setProgress((prevState) => prevState + (1 / progressArr.length) * 100);
      // If char in textfield is used, make it focused
      const focusArr: boolean[] = Array(12).fill(false),
        disabledArr: boolean[] = Array(12).fill(false);
      updateFocus(state, focusArr);
      // If textfield is not focused, make it disabled
      focusArr.forEach((val, i) => {
        if (!val) {
          disabledArr[i] = true;
        }
      });
      setFocusFields(focusArr);
      setDisabledFields(disabledArr);
      await sleep(delay);
    }
  };

  /**
   * Update focusArr in place based on the current state
   */
  const updateFocus = (stateArr: string[], focusArr: boolean[]) => {
    const fieldsArr = Object.values(fields); // Get current characters in fields state
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

  let theme = createTheme({
    typography: {
      fontFamily: "Open Sans, sans-serif",
    },
  });
  theme = responsiveFontSizes(theme);

  return (
    <ThemeProvider theme={theme}>
      <MyAppBar />

      <Box
        paddingTop={10}
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
      >
        <Stack direction="row" spacing={2}>
          {Object.entries(fields)
            .slice(0, 3)
            .map(([key, value]) => (
              <MyTextField
                key={key}
                idx={key}
                ref={inputRefs}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleBackspace}
                focused={focusFields[parseInt(key)]}
                disabled={disabledFields[parseInt(key)]}
              />
            ))}
        </Stack>

        <Grid container justifyContent="center">
          <Grid>
            <Stack direction="column" spacing={2}>
              {Object.entries(fields)
                .slice(3, 6)
                .map(([key, value]) => (
                  <MyTextField
                    key={key}
                    idx={key}
                    ref={inputRefs}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleBackspace}
                    focused={focusFields[parseInt(key)]}
                    disabled={disabledFields[parseInt(key)]}
                  />
                ))}
            </Stack>
          </Grid>

          <Grid>
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
            </Stack>
          </Grid>

          <Grid>
            <Stack direction="column" spacing={2}>
              {Object.entries(fields)
                .slice(6, 9)
                .map(([key, value]) => (
                  <MyTextField
                    key={key}
                    idx={key}
                    ref={inputRefs}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleBackspace}
                    focused={focusFields[parseInt(key)]}
                    disabled={disabledFields[parseInt(key)]}
                  />
                ))}
            </Stack>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2}>
          {Object.entries(fields)
            .slice(9)
            .map(([key, value]) => (
              <MyTextField
                key={key}
                idx={key}
                ref={inputRefs}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleBackspace}
                focused={focusFields[parseInt(key)]}
                disabled={disabledFields[parseInt(key)]}
              />
            ))}
        </Stack>

        <Stack direction="row" spacing={2} margin={2}>
          <Button color="error" variant="contained" onClick={resetFields}>
            Reset
          </Button>
          {
            // If initial solve is not successful, do not show `Find Best` button
            solution.length === 0 ||
            !isSuccess ||
            visualize ||
            Object.values(fields).join("") !== prevInput.join("") ? (
              <LoadingButton
                loading={solving}
                variant="contained"
                onClick={handleSolve}
              >
                Solve
              </LoadingButton>
            ) : (
              <LoadingButton
                loading={solving}
                variant="contained"
                onClick={findBest}
              >
                Find Best
              </LoadingButton>
            )
          }
        </Stack>

        <Box width="50%" mr={1}>
          <Slider
            min={0}
            max={prevProcess.length - 1}
            onChange={handleSliderChange}
            disabled={!prevProcess.length || solving}
          />
        </Box>

        <Stack direction="row" spacing={2}>
          <FormControlLabel
            disabled={solving}
            control={
              <Checkbox checked={visualize} onChange={handleVizChange} />
            }
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

        <Grid container>
          <Grid textAlign="center" marginX={2}>
            {bestSolution.length !== 0 && <h3>Initial solution:</h3>}
            {solution &&
              solution.map((word, index) => <p key={index}>{word}</p>)}
          </Grid>

          {bestSolution.length !== 0 && (
            <Grid textAlign="center" marginX={2}>
              <h3>Best solution:</h3>
              {bestSolution.map((word, index) => (
                <p key={index}>{word}</p>
              ))}
            </Grid>
          )}
        </Grid>

        {!solving && !isSuccess && (
          <h2>No solution found using up to {MOST_WORDS} words</h2>
        )}
      </Box>
    </ThemeProvider>
  );
}
