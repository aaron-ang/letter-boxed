import { useRef } from "react";

import ControlPanel from "@/components/controls/ControlPanel";
import GameBoard from "@/components/game/GameBoard";
import MyAppBar from "@/components/MyAppBar";
import SolutionDisplay from "@/components/solutions/SolutionDisplay";
import VisualizationControls from "@/components/visualization/VisualizationControls";
import { getSolution } from "@/solver/solverClient";
import { groupLetters, useGameStore } from "@/store/gameStore";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-z]/gi, "");
    const name = e.target.name;
    useGameStore.getState().setFieldAt(name, value);
    if (value !== "") {
      inputRefs.current[Number.parseInt(name, 10) + 1]?.focus();
    }
  };

  const handleBackspace = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (e.key === "Backspace" && target.value === "") {
      inputRefs.current[Number.parseInt(target.name, 10) - 1]?.focus();
    }
  };

  const resetFields = () => {
    location.reload(); // Only way to cancel promise chain
  };

  const handleSolve = async () => {
    const store = useGameStore.getState();
    try {
      store.setSolution([]);
      store.setBestSolution([]);
      const input = groupLetters(store.fields);
      console.log(`input: ${input}`);
      store.setSolving(true);

      let process: string[][];
      let success: boolean;

      // check cache
      if (input.every((v, i) => v === store.prevInput[i])) {
        process = store.prevProcess;
        success = true;
      } else {
        const res = await getSolution(input);
        process = res.data;
        success = res.success;
      }

      useGameStore.setState({
        prevProcess: process,
        isSuccess: success,
        prevInput: input,
      });

      await updateBoard(process);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    } finally {
      useGameStore.getState().setSolving(false);
    }
  };

  const updateBoard = async (process: string[][]) => {
    const store = useGameStore.getState();

    if (store.visualize) {
      for (let i = 0; i < process.length; i++) {
        useGameStore.getState().gotoStep(i);
        await sleep(useGameStore.getState().delay);
      }
    } else {
      const finalIdx = process.length - 1;
      if (finalIdx >= 0) {
        useGameStore.getState().gotoStep(finalIdx);
      }
      useGameStore.setState({ disabledFields: [] });
    }
  };

  const findBest = async () => {
    const store = useGameStore.getState();
    try {
      if (store.bestSolution.length !== 0) return;
      store.setSolving(true);
      const res = await getSolution(store.prevInput, store.solution.length);
      store.setBestSolution(res.data);
    } catch (err) {
      alert(err);
    } finally {
      useGameStore.getState().setSolving(false);
    }
  };

  const fields = useGameStore((s) => s.fields);
  const prevInput = useGameStore((s) => s.prevInput);
  const fieldsMatch = Object.values(fields).join("") === prevInput.join("");

  return (
    <>
      <MyAppBar />
      <div className="flex flex-col items-center pt-10">
        <GameBoard
          handleInputChange={handleInputChange}
          handleBackspace={handleBackspace}
          inputRefs={inputRefs}
        />

        <ControlPanel
          fieldsMatch={fieldsMatch}
          resetFields={resetFields}
          handleSolve={handleSolve}
          findBest={findBest}
        />

        <VisualizationControls />

        <SolutionDisplay />
      </div>
    </>
  );
}
