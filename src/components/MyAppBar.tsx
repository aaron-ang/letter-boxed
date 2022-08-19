import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import GitHubIcon from "@mui/icons-material/GitHub";

const MyAppBar = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() =>
              (window.location.href =
                "https://github.com/aaron-ang/letter-boxed")
            }
          >
            <GitHubIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Letter Boxed
          </Typography>
          <Button
            color="inherit"
            onClick={() => window.open("https://forms.gle/fVdX9G4wSNjPkMTA7")}
          >
            Feedback
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default MyAppBar;
