import { useGameStore } from "@/store/gameStore";

const MOST_WORDS = 5;

const SolutionDisplay: React.FC = () => {
  const solution = useGameStore((s) => s.solution);
  const bestSolution = useGameStore((s) => s.bestSolution);
  const solving = useGameStore((s) => s.solving);
  const isSuccess = useGameStore((s) => s.isSuccess);

  return (
    <>
      <div className="mt-2 flex flex-row justify-center gap-8">
        <div className="mx-2 text-center">
          {bestSolution.length !== 0 && (
            <h3 className="font-semibold text-lg">Initial solution:</h3>
          )}
          {solution?.map((word) => (
            <p key={word}>{word}</p>
          ))}
        </div>

        {bestSolution.length !== 0 && (
          <div className="mx-2 text-center">
            <h3 className="font-semibold text-lg">Best solution:</h3>
            {bestSolution.map((word) => (
              <p key={word}>{word}</p>
            ))}
          </div>
        )}
      </div>

      {!solving && !isSuccess && (
        <h2 className="mt-2 font-semibold text-xl">
          No solution found using up to {MOST_WORDS} words
        </h2>
      )}
    </>
  );
};

export default SolutionDisplay;
