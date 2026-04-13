import Box from "@mui/material/Box";
import LinearProgress, { type LinearProgressProps } from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

export default function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
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
