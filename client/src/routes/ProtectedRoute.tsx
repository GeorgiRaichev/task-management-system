import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import type { UserRole } from '../features/auth/types';

type ProtectedRouteProps = {
    allowedRoles?: UserRole[];
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isAuthChecked } = useAppSelector((state) => state.auth);

    if (!isAuthChecked) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}