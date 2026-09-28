import type React from "react";

import MyTextField from "@/components/game/MyTextField";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";

type GameBoardProps = {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBackspace: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRefs: React.RefObject<Array<HTMLInputElement | null>>;
};

// Grid position per field index (row, col) — 5x5 grid, corners empty.
// A uniform gap puts letters at the quarter points of each side, like NYT's board.
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
    <div className="relative grid grid-cols-[repeat(5,auto)] grid-rows-[repeat(5,auto)] items-center justify-items-center gap-4 [--cell:--spacing(14)] sm:gap-7 lg:gap-8 lg:[--cell:--spacing(16)]">
      {/* NYT-style box: edges run through the letter centers (inset = half a cell) */}
      <div className="absolute inset-[calc(var(--cell)/2)] border-2 border-ink bg-card" />

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

      <div className="relative col-start-2 col-end-5 row-start-2 row-end-5 flex flex-col items-center justify-center gap-6">
        <Button
          variant="outline"
          disabled={solving}
          onClick={generateRandom}
          className="h-10 w-36 rounded-full bg-card"
        >
          Random Puzzle
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open("https://www.nytimes.com/puzzles/letter-boxed")}
          className="h-10 w-36 rounded-full bg-card"
        >
          Visit NYT Site
        </Button>
      </div>
    </div>
  );
};

export default GameBoard;
