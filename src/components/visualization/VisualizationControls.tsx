import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Slider from "@mui/material/Slider";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import LinearProgressWithLabel from "./LinearProgressWithLabel";

type VisualizationControlsProps = {
  visualize: boolean;
  delay: number;
  progress: number;
  prevProcess: string[][];
  solving: boolean;
  handleVizChange: () => void;
  handleDelayChange: (event: SelectChangeEvent) => void;
  handleSliderChange: (event: Event, value: number | number[]) => void;
};

const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  visualize,
  delay,
  progress,
  prevProcess,
  solving,
  handleVizChange,
  handleDelayChange,
  handleSliderChange,
}) => {
  return (
    <>
      <Box width="50%" mr={1}>
        <Slider
          min={0}
          max={prevProcess.length - 1}
          onChange={handleSliderChange}
          disabled={!prevProcess.length || solving}
        />
      </Box>

      <Stack direction="row" spacing={2}>
        <FormControlLabel
          disabled={solving}
          control={<Checkbox checked={visualize} onChange={handleVizChange} />}
          label="Visualize"
        />

        <FormControl sx={{ minWidth: 80 }} disabled={!visualize || solving}>
          <InputLabel id="delay-label">Delay(ms)</InputLabel>
          <Select
            value={delay.toString()}
            labelId="delay-label"
            label="Delay(ms)"
            onChange={handleDelayChange}
          >
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <LinearProgressWithLabel value={progress} />
    </>
  );
};

export default VisualizationControls;
