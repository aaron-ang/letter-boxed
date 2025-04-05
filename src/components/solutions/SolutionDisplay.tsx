import Grid from "@mui/material/Grid";

type SolutionDisplayProps = {
  solution: string[];
  bestSolution: string[];
  solving: boolean;
  isSuccess: boolean;
};

const MOST_WORDS = 5;

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({
  solution,
  bestSolution,
  solving,
  isSuccess,
}) => {
  return (
    <>
      <Grid container>
        <Grid textAlign="center" marginX={2}>
          {bestSolution.length !== 0 && <h3>Initial solution:</h3>}
          {solution && solution.map((word, index) => <p key={index}>{word}</p>)}
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
    </>
  );
};

export default SolutionDisplay;
