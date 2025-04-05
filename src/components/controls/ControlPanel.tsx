import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import LoadingButton from "@mui/lab/LoadingButton";

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
    <Stack direction="row" spacing={2} margin={2}>
      <Button color="error" variant="contained" onClick={resetFields}>
        Reset
      </Button>
      {
        // If initial solve is not successful, do not show `Find Best` button
        solution.length === 0 ||
        !isSuccess ||
        visualize ||
        !fieldsMatch ? (
          <LoadingButton
            loading={solving}
            variant="contained"
            onClick={handleSolve}
          >
            Solve
          </LoadingButton>
        ) : (
          <LoadingButton
            loading={solving}
            variant="contained"
            onClick={findBest}
          >
            Find Best
          </LoadingButton>
        )
      }
    </Stack>
  );
};

export default ControlPanel;
