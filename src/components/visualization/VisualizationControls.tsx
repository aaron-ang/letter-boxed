import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useGameStore } from "../../store/gameStore";

const VisualizationControls: React.FC = () => {
  const visualize = useGameStore((s) => s.visualize);
  const delay = useGameStore((s) => s.delay);
  const prevProcess = useGameStore((s) => s.prevProcess);
  const solving = useGameStore((s) => s.solving);
  const currentStep = useGameStore((s) => s.currentStep);
  const setVisualize = useGameStore((s) => s.setVisualize);
  const setDelay = useGameStore((s) => s.setDelay);
  const gotoStep = useGameStore((s) => s.gotoStep);

  const steps = prevProcess.length;
  const disabled = !steps || solving;
  const pct = steps ? Math.round(((currentStep + 1) / steps) * 100) : 0;

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ width: "60%", alignItems: "center", mt: 1, mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Slider
            min={0}
            max={Math.max(steps - 1, 1)}
            value={Math.min(currentStep, Math.max(steps - 1, 0))}
            onChangeCommitted={(_, v) => {
              const n = v as number;
              if (n !== currentStep && steps > 1) gotoStep(n);
            }}
            disabled={disabled}
          />
        </Box>

        <IconButton
          size="small"
          disabled={disabled || currentStep <= 0}
          onClick={() => gotoStep(currentStep - 1)}
          aria-label="previous step"
        >
          <ChevronLeftIcon />
        </IconButton>

        <IconButton
          size="small"
          disabled={disabled || currentStep >= steps - 1}
          onClick={() => gotoStep(currentStep + 1)}
          aria-label="next step"
        >
          <ChevronRightIcon />
        </IconButton>

        <Typography variant="body2" sx={{ minWidth: 90, textAlign: "right" }}>
          {steps ? `${currentStep + 1} / ${steps} (${pct}%)` : "— / —"}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2}>
        <FormControlLabel
          disabled={solving}
          control={<Checkbox checked={visualize} onChange={() => setVisualize(!visualize)} />}
          label="Visualize"
        />

        <FormControl sx={{ minWidth: 80 }} disabled={!visualize || solving}>
          <InputLabel id="delay-label">Delay(ms)</InputLabel>
          <Select
            value={delay.toString()}
            labelId="delay-label"
            label="Delay(ms)"
            onChange={(e) => setDelay(Number.parseInt(e.target.value, 10))}
          >
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </>
  );
};

export default VisualizationControls;
