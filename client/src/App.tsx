import { useEffect } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useAppSelector } from './app/hooks';
import { useGetMeQuery } from './features/auth/authApi';
import AppRouter from './routes/AppRouter';
import { connectSocket } from './services/socket';
import { theme } from './theme';

export default function App() {
    const accessToken = useAppSelector((state) => state.auth.accessToken);

    useGetMeQuery(undefined, {
        skip: !accessToken
    });

    useEffect(() => {
        if (accessToken) {
            connectSocket(accessToken);
        }
    }, [accessToken]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppRouter />
        </ThemeProvider>
    );
}