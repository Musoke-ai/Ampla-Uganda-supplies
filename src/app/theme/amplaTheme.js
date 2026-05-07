import { createTheme } from "@mui/material/styles";

const amplaTheme = createTheme({
  palette: {
    primary: {
      main: "#1C4E80",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#488A99",
      contrastText: "#ffffff",
    },
    success: {
      main: "#2E7D32",
    },
    error: {
      main: "#D32F2F",
    },
    background: {
      default: "#F6F8FA",
      paper: "#ffffff",
    },
    text: {
      primary: "#202020",
      secondary: "#5F6B7A",
    },
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', Arial, sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 36,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
        },
      },
    },
  },
});

export default amplaTheme;
