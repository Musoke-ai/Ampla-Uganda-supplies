import { createTheme, alpha } from "@mui/material/styles";

const amplaThemeModern = createTheme({
  palette: {
    primary: {
      main: "#1C4E80",
      light: "#2E5C8F",
      lighter: "#5B7FA6",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#488A99",
      light: "#5A9AAB",
      lighter: "#7BA5B8",
      contrastText: "#ffffff",
    },
    success: {
      main: "#2E7D32",
      light: "#43A047",
    },
    error: {
      main: "#D32F2F",
      light: "#F44336",
    },
    warning: {
      main: "#F57C00",
      light: "#FB8C00",
    },
    info: {
      main: "#1976D2",
      light: "#2196F3",
    },
    background: {
      default: "#eff4f7",
      paper: "#ffffff",
      secondary: "#f7fafc",
    },
    text: {
      primary: "#1A202C",
      secondary: "#718096",
      tertiary: "#A0AEC0",
    },
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily: "'Poppins', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    h1: {
      fontSize: "2.8rem",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-0.06em",
    },
    h2: {
      fontSize: "2.15rem",
      fontWeight: 800,
      lineHeight: 1.15,
      letterSpacing: "-0.05em",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "0.95rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "0.98rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.57,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      fontSize: "0.95rem",
      letterSpacing: "0.3px",
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  shadows: [
    "none",
    "0px 1px 3px rgba(0, 0, 0, 0.06), 0px 1px 2px rgba(0, 0, 0, 0.04)",
    "0px 4px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.05)",
    "0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)",
    "0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)",
    "0px 25px 50px rgba(0, 0, 0, 0.15)",
    "0px 25px 50px rgba(0, 0, 0, 0.15)",
    "0px 25px 50px rgba(0, 0, 0, 0.15)",
    "0px 25px 50px rgba(0, 0, 0, 0.15)",
    "0px 25px 50px rgba(0, 0, 0, 0.15)",
    "0px 25px 50px rgba(0, 0, 0, 0.15)",
    "0px 25px 50px rgba(0, 0, 0, 0.15)",
    "0px 25px 50px rgba(0, 0, 0, 0.15)",
  ],
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: false,
      },
      styleOverrides: {
      root: {
          minHeight: 42,
          borderRadius: 14,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        },
        contained: {
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.15)",
          },
        },
        outlined: {
          borderWidth: 1.5,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 20,
          border: "1px solid rgba(19, 41, 61, 0.08)",
        },
        elevation1: {
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.06)",
        },
        elevation2: {
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.07)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: "1px solid rgba(19, 41, 61, 0.08)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0px 16px 40px rgba(15, 34, 54, 0.09)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: "var(--ampla-surface-soft, #F8FAFC)",
          borderColor: "var(--ampla-border-color, #E2E8F0)",
        },
        body: {
          borderColor: "var(--ampla-border-color, #E2E8F0)",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.2s",
          "&:hover": {
            backgroundColor: "var(--ampla-surface-soft, #F8FAFC)",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#488A99",
          },
        },
        notchedOutline: {
          borderColor: "#E2E8F0",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0px 8px 30px rgba(15, 34, 54, 0.08)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: "none",
          boxShadow: "2px 0px 8px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.12)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.8rem",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at top left, rgba(243,197,108,0.14), transparent 25%), linear-gradient(180deg, #f8fbff 0%, #eef4f7 100%)",
          color: "#1A202C",
        },
        "::selection": {
          backgroundColor: alpha("#1C4E80", 0.16),
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(26, 32, 44, 0.5)",
        },
      },
    },
  },
});

export default amplaThemeModern;
