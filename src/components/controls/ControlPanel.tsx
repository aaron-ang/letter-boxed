import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

type ControlPanelProps = {
  solving: boolean;
  solution: string[];
  isSuccess: boolean;
  visualize: boolean;
  fieldsMatch: boolean;
  resetFields: () => void;
  handleSolve: () => void;
  findBest: () => void;
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  solving,
  solution,
  isSuccess,
  visualize,
  fieldsMatch,
  resetFields,
  handleSolve,
  findBest,
}) => {
  return (
    <Stack direction="row" spacing={2} sx={{ margin: 2 }}>
      <Button color="error" variant="contained" onClick={resetFields}>
        Reset
      </Button>
      {solution.length === 0 || !isSuccess || visualize || !fieldsMatch ? (
        <Button loading={solving} variant="contained" onClick={handleSolve}>
          Solve
        </Button>
      ) : (
        <Button loading={solving} variant="contained" onClick={findBest}>
          Find Best
        </Button>
      )}
    </Stack>
  );
};

export default ControlPanel;
