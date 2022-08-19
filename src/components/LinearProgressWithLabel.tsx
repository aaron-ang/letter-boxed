import LinearProgress, {
  LinearProgressProps,
} from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function LinearProgressWithLabel(
  props: LinearProgressProps & { value: number }
) {
  return (
    <Box
      width="100%"
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Box sx={{ width: "50%", mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}
