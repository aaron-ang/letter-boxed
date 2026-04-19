import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type React from "react";

import { useGameStore } from "../../store/gameStore";
import MyTextField from "./MyTextField";

type GameBoardProps = {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBackspace: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRefs: React.RefObject<Array<HTMLDivElement | null>>;
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
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(5, auto)",
        gridTemplateRows: "repeat(5, auto)",
        columnGap: 3,
        rowGap: 3,
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      {Object.entries(fields).map(([key, value], i) => {
        const [row, col] = POS[i];
        return (
          <Box key={key} sx={{ gridRow: row, gridColumn: col }}>
            <MyTextField
              idx={key}
              ref={inputRefs}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleBackspace}
              usages={usages[i] ?? []}
              disabled={disabledFields[i] ?? false}
            />
          </Box>
        );
      })}

      <Box sx={{ gridRow: "2 / 5", gridColumn: "2 / 5" }}>
        <Stack direction="column" spacing={3}>
          <Button variant="outlined" color="secondary" disabled={solving} onClick={generateRandom}>
            Random Puzzle
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => window.open("https://www.nytimes.com/puzzles/letter-boxed")}
          >
            Visit NYT Site
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default GameBoard;
