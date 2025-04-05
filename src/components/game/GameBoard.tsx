import React from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";

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
              sequencePosition={focusFields[parseInt(key)]}
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
                  sequencePosition={focusFields[parseInt(key)]}
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
                  sequencePosition={focusFields[parseInt(key)]}
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
              sequencePosition={focusFields[parseInt(key)]}
              disabled={disabledFields[parseInt(key)]}
            />
          ))}
      </Stack>
    </>
  );
};

export default GameBoard;
