import type React from "react";

import MyTextField from "@/components/game/MyTextField";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";

type GameBoardProps = {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBackspace: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRefs: React.RefObject<Array<HTMLInputElement | null>>;
};

// Grid position per field index (row, col) — 5x5 grid, corners empty
// 0-2: top row (row 1)
// 3-5: left col (col 1)
// 6-8: right col (col 5)
// 9-11: bottom row (row 5)
const POS: Array<[number, number]> = [
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 1],
  [3, 1],
  [4, 1],
  [2, 5],
  [3, 5],
  [4, 5],
  [5, 2],
  [5, 3],
  [5, 4],
];

const GameBoard: React.FC<GameBoardProps> = ({ handleInputChange, handleBackspace, inputRefs }) => {
  const fields = useGameStore((s) => s.fields);
  const usages = useGameStore((s) => s.usages);
  const disabledFields = useGameStore((s) => s.disabledFields);
  const solving = useGameStore((s) => s.solving);
  const generateRandom = useGameStore((s) => s.generateRandom);

  return (
    <div
      className="grid items-center justify-items-center"
      style={{
        gridTemplateColumns: "repeat(5, auto)",
        gridTemplateRows: "repeat(5, auto)",
        columnGap: 24,
        rowGap: 24,
      }}
    >
      {Object.entries(fields).map(([key, value], i) => {
        const [row, col] = POS[i];
        return (
          <div key={key} style={{ gridRow: row, gridColumn: col }}>
            <MyTextField
              idx={key}
              inputRefs={inputRefs}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleBackspace}
              usages={usages[i] ?? []}
              disabled={disabledFields[i] ?? false}
            />
          </div>
        );
      })}

      <div className="flex flex-col gap-3" style={{ gridRow: "2 / 5", gridColumn: "2 / 5" }}>
        <Button variant="outline" disabled={solving} onClick={generateRandom}>
          Random Puzzle
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open("https://www.nytimes.com/puzzles/letter-boxed")}
        >
          Visit NYT Site
        </Button>
      </div>
    </div>
  );
};

export default GameBoard;
