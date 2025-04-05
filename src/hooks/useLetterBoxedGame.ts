import { useState, useRef } from "react";

export function useLetterBoxedGame() {
  const defaultFields = { ...Array(12).fill("") };

  const [fields, setFields] = useState<Record<number, string>>(defaultFields);
  const [solution, setSolution] = useState<string[]>([]);
  const [visualize, setVisualize] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(true);
  const [delay, setDelay] = useState(5);
  const [prevInput, setPrevInput] = useState<string[]>([]);
  const [prevProcess, setPrevProcess] = useState<string[][]>([]);
  const [bestSolution, setBestSolution] = useState<string[]>([]);

  // To allow TextField state to vary while visualizing
  const [disabledFields, setDisabledFields] = useState<boolean[]>([]);
  const [focusFields, setFocusFields] = useState<number[]>([]);

  const inputRefs = useRef<Array<HTMLDivElement | null>>([]);

  const groupLetters = (fields: Record<number, string>) => {
    if (Object.values(fields).includes("")) {
      throw new Error("Please fill out all fields");
    }

    const arr = Object.values(fields);
    const res: string[] = [];

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

  const updateFocus = (stateArr: string[], focusArr: number[]) => {
    const fieldsArr = Object.values(fields); // Get current characters in fields state

    // Initialize all positions to -1 (not in sequence)
    focusArr.fill(-1);

    const allChars = stateArr.flatMap((word) => [...word]);

    allChars.reduce(
      (acc, char) => {
        // Skip if we've already processed this character or reached position limit
        if (acc.processedChars.has(char) || acc.positionCounter >= 12) {
          return acc;
        }

        const index = fieldsArr.indexOf(char);
        if (index !== -1) {
          focusArr[index] = acc.positionCounter;
          acc.processedChars.add(char);
          acc.positionCounter++;
        }

        return acc;
      },
      {
        processedChars: new Set<string>(),
        positionCounter: 0,
      }
    );
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

  return {
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
  };
}
