import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2563eb',
            dark: '#1d4ed8',
            light: '#60a5fa'
        },
        secondary: {
            main: '#0f766e',
            dark: '#115e59',
            light: '#5eead4'
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff'
        },
        text: {
            primary: '#0f172a',
            secondary: '#64748b'
        }
    },
    shape: {
        borderRadius: 14
    },
    typography: {
        fontFamily: 'Inter, Arial, sans-serif',
        h4: {
            fontWeight: 800,
            letterSpacing: '-0.04em'
        },
        h5: {
            fontWeight: 800,
            letterSpacing: '-0.03em'
        },
        h6: {
            fontWeight: 700
        },
        button: {
            fontWeight: 700,
            textTransform: 'none'
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: 'none'
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 18,
                    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
                    border: '1px solid rgba(148, 163, 184, 0.18)'
                }
            }
        },
        MuiTextField: {
            defaultProps: {
                size: 'medium'
            }
        }
    }
});