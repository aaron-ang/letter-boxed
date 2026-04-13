import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import type React from "react";

import MyTextField from "./MyTextField";

type GameBoardProps = {
  fields: Record<number, string>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBackspace: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  focusFields: number[];
  disabledFields: boolean[];
  inputRefs: React.RefObject<Array<HTMLDivElement | null>>;
  solving: boolean;
  generateRandom: () => void;
};

const GameBoard: React.FC<GameBoardProps> = ({
  fields,
  handleInputChange,
  handleBackspace,
  focusFields,
  disabledFields,
  inputRefs,
  solving,
  generateRandom,
}) => {
  return (
    <>
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
              sequencePosition={focusFields[Number.parseInt(key, 10)]}
              disabled={disabledFields[Number.parseInt(key, 10)]}
            />
          ))}
      </Stack>

      <Grid container sx={{ justifyContent: "center" }}>
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
                  sequencePosition={focusFields[Number.parseInt(key, 10)]}
                  disabled={disabledFields[Number.parseInt(key, 10)]}
                />
              ))}
          </Stack>
        </Grid>

        <Grid>
          <Stack direction="column" spacing={5} sx={{ m: 5 }}>
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
              onClick={() => window.open("https://www.nytimes.com/puzzles/letter-boxed")}
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
                  sequencePosition={focusFields[Number.parseInt(key, 10)]}
                  disabled={disabledFields[Number.parseInt(key, 10)]}
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
              sequencePosition={focusFields[Number.parseInt(key, 10)]}
              disabled={disabledFields[Number.parseInt(key, 10)]}
            />
          ))}
      </Stack>
    </>
  );
};

export default GameBoard;
