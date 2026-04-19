import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { useGameStore } from "../../store/gameStore";

type ControlPanelProps = {
  fieldsMatch: boolean;
  resetFields: () => void;
  handleSolve: () => void;
  findBest: () => void;
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  fieldsMatch,
  resetFields,
  handleSolve,
  findBest,
}) => {
  const solving = useGameStore((s) => s.solving);
  const solution = useGameStore((s) => s.solution);
  const isSuccess = useGameStore((s) => s.isSuccess);
  const visualize = useGameStore((s) => s.visualize);

  const showFindBest = solution.length > 0 && isSuccess && !visualize && fieldsMatch;

  return (
    <Stack direction="row" spacing={2} sx={{ mt: 6, mb: 2 }}>
      <Button color="error" variant="contained" onClick={resetFields}>
        Reset
      </Button>
      {showFindBest ? (
        <Button loading={solving} variant="contained" onClick={findBest}>
          Find Best
        </Button>
      ) : (
        <Button loading={solving} variant="contained" onClick={handleSolve}>
          Solve
        </Button>
      )}
    </Stack>
  );
};

export default ControlPanel;
