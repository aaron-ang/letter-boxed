import Grid from "@mui/material/Grid";

import { useGameStore } from "../../store/gameStore";

const MOST_WORDS = 5;

const SolutionDisplay: React.FC = () => {
  const solution = useGameStore((s) => s.solution);
  const bestSolution = useGameStore((s) => s.bestSolution);
  const solving = useGameStore((s) => s.solving);
  const isSuccess = useGameStore((s) => s.isSuccess);

  return (
    <>
      <Grid container>
        <Grid sx={{ textAlign: "center", marginX: 2 }}>
          {bestSolution.length !== 0 && <h3>Initial solution:</h3>}
          {solution?.map((word) => (
            <p key={word}>{word}</p>
          ))}
        </Grid>

        {bestSolution.length !== 0 && (
          <Grid sx={{ textAlign: "center", marginX: 2 }}>
            <h3>Best solution:</h3>
            {bestSolution.map((word) => (
              <p key={word}>{word}</p>
            ))}
          </Grid>
        )}
      </Grid>

      {!solving && !isSuccess && <h2>No solution found using up to {MOST_WORDS} words</h2>}
    </>
  );
};

export default SolutionDisplay;
