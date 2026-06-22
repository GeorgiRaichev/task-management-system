import { useEffect } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useAppSelector } from './app/hooks';
import { useGetMeQuery } from './features/auth/authApi';
import AppRouter from './routes/AppRouter';
import { connectSocket } from './services/socket';
import { theme } from './theme';

export default function App() {
    const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);

    useGetMeQuery(undefined, {
        skip: isAuthenticated
    });

    useEffect(() => {
        if (isAuthenticated) {
            connectSocket(accessToken);
        }
    }, [accessToken, isAuthenticated]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppRouter />
        </ThemeProvider>
    );
}