import axios from "axios";
import Box from "@mui/material/Box";
import { SelectChangeEvent } from "@mui/material/Select";
import { createTheme, responsiveFontSizes, ThemeProvider } from "@mui/material";

import MyAppBar from "./components/MyAppBar";
import GameBoard from "./components/game/GameBoard";
import ControlPanel from "./components/controls/ControlPanel";
import VisualizationControls from "./components/visualization/VisualizationControls";
import SolutionDisplay from "./components/solutions/SolutionDisplay";
import { useLetterBoxedAPI } from "./hooks/useLetterBoxedAPI";
import { useLetterBoxedGame } from "./hooks/useLetterBoxedGame";

export default function App() {
  const {
    fields,
    setFields,
    solution,
    setSolution,
    visualize,
    setVisualize,
    progress,
    setProgress,
    isSuccess,
    setIsSuccess,
    delay,
    setDelay,
    prevInput,
    setPrevInput,
    prevProcess,
    setPrevProcess,
    bestSolution,
    setBestSolution,
    disabledFields,
    setDisabledFields,
    focusFields,
    setFocusFields,
    inputRefs,
    groupLetters,
    updateFocus,
    generateRandom,
  } = useLetterBoxedGame();

  const { solving, setSolving, getSolution, sleep } = useLetterBoxedAPI();

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
      focusArr: number[] = Array(12).fill(-1),
      disabledArr: boolean[] = Array(12).fill(false);
    updateFocus(step, focusArr);
    focusArr.forEach((val, i) => {
      if (val === -1) {
        disabledArr[i] = true;
      }
    });
    setFocusFields(focusArr);
    setDisabledFields(disabledArr);
    setSolution(step);
  };

  const updateBoard = async (progressArr: string[][]) => {
    setProgress(0);

    if (visualize) {
      await processVisualization(progressArr);
    } else {
      const solution = progressArr[progressArr.length - 1] ?? [],
        focusArr: number[] = Array(12).fill(-1);
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
      const focusArr: number[] = Array(12).fill(-1),
        disabledArr: boolean[] = Array(12).fill(false);
      updateFocus(state, focusArr);
      // If textfield is not focused, make it disabled
      focusArr.forEach((val, i) => {
        if (val === -1) {
          disabledArr[i] = true;
        }
      });
      setFocusFields(focusArr);
      setDisabledFields(disabledArr);
      await sleep(delay);
    }
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

  let theme = createTheme({
    typography: {
      fontFamily: "Open Sans, sans-serif",
    },
  });
  theme = responsiveFontSizes(theme);

  const fieldsMatch = Object.values(fields).join("") === prevInput.join("");

  return (
    <ThemeProvider theme={theme}>
      <MyAppBar />

      <Box
        paddingTop={10}
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
      >
        <GameBoard
          fields={fields}
          handleInputChange={handleInputChange}
          handleBackspace={handleBackspace}
          focusFields={focusFields}
          disabledFields={disabledFields}
          inputRefs={inputRefs}
          solving={solving}
          generateRandom={generateRandom}
        />

        <ControlPanel
          solving={solving}
          solution={solution}
          isSuccess={isSuccess}
          visualize={visualize}
          fieldsMatch={fieldsMatch}
          resetFields={resetFields}
          handleSolve={handleSolve}
          findBest={findBest}
        />

        <VisualizationControls
          visualize={visualize}
          delay={delay}
          progress={progress}
          prevProcess={prevProcess}
          solving={solving}
          handleVizChange={handleVizChange}
          handleDelayChange={handleDelayChange}
          handleSliderChange={handleSliderChange}
        />

        <SolutionDisplay
          solution={solution}
          bestSolution={bestSolution}
          solving={solving}
          isSuccess={isSuccess}
        />
      </Box>
    </ThemeProvider>
  );
}
