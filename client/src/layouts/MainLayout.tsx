import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Button,
    Container,
    Stack,
    Toolbar,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAppSelector } from '../app/hooks';
import { useLogoutMutation } from '../features/auth/authApi';
import { UserRole } from '../features/auth/types';
import { useGetNotificationsQuery } from '../features/notifications/notificationsApi';
import { useTranslate } from '../hooks/useTranslate';
import { disconnectSocket } from '../services/socket';

export default function MainLayout() {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const translate = useTranslate();
    const [logout] = useLogoutMutation();
    const { user } = useAppSelector((state) => state.auth);

    const { data: notificationsData } = useGetNotificationsQuery(undefined, {
        skip: !user,
        refetchOnMountOrArgChange: true
    });

    const unreadNotificationsCount =
        notificationsData?.notifications.filter((notification) => !notification.isRead).length || 0;

    const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'N/A';

    const navItems = [
        {
            label: translate('dashboard'),
            path: '/dashboard',
            icon: <DashboardRoundedIcon fontSize="small" />,
            visible: true
        },
        {
            label: translate('projects'),
            path: '/projects',
            icon: <FolderRoundedIcon fontSize="small" />,
            visible: true
        },
        {
            label: translate('groups'),
            path: '/groups',
            icon: <GroupsRoundedIcon fontSize="small" />,
            visible: true
        },
        {
            label: translate('users'),
            path: '/users',
            icon: <GroupRoundedIcon fontSize="small" />,
            visible: user?.role === UserRole.ADMINISTRATOR
        },
        {
            label: translate('notifications'),
            path: '/notifications',
            icon: (
                <Badge
                    badgeContent={unreadNotificationsCount}
                    color="error"
                    invisible={unreadNotificationsCount === 0}
                >
                    <NotificationsRoundedIcon fontSize="small" />
                </Badge>
            ),
            visible: true
        }
    ];

    const handleLogout = async () => {
        await logout().unwrap();
        disconnectSocket();
        navigate('/login');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background:
                    'radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 32%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)'
            }}
        >
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.86),
                    backdropFilter: 'blur(18px)',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                    color: 'text.primary'
                }}
            >
                <Toolbar sx={{ minHeight: 76 }}>
                    <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                            flexGrow: 1,
                            alignItems: 'center'
                        }}
                    >
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 3,
                                display: 'grid',
                                placeItems: 'center',
                                color: 'common.white',
                                background: 'linear-gradient(135deg, #2563eb 0%, #0f766e 100%)',
                                boxShadow: '0 12px 24px rgba(37, 99, 235, 0.25)'
                            }}
                        >
                            <DashboardRoundedIcon />
                        </Box>

                        <Box>
                            <Typography variant="h6" sx={{ lineHeight: 1 }}>
                                {translate('appTitle')}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                                {translate('overview')}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            alignItems: 'center'
                        }}
                    >
                        {navItems
                            .filter((item) => item.visible)
                            .map((item) => {
                                const isActive = location.pathname === item.path;

                                return (
                                    <Button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        startIcon={item.icon}
                                        sx={{
                                            px: 1.6,
                                            color: isActive ? 'primary.main' : 'text.secondary',
                                            bgcolor: isActive
                                                ? alpha(theme.palette.primary.main, 0.1)
                                                : 'transparent',
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.08)
                                            }
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                );
                            })}

                        <Stack
                            direction="row"
                            spacing={1.2}
                            sx={{
                                alignItems: 'center',
                                ml: 1.5,
                                pl: 1.5,
                                borderLeft: `1px solid ${alpha(theme.palette.divider, 0.8)}`
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 38,
                                    height: 38,
                                    bgcolor: 'primary.main',
                                    fontWeight: 800
                                }}
                            >
                                {initials}
                            </Avatar>

                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 800,
                                        lineHeight: 1.1
                                    }}
                                >
                                    {user
                                        ? `${user.firstName} ${user.lastName}`
                                        : translate('notAvailable')}
                                </Typography>

                                <Typography variant="caption" color="text.secondary">
                                    {user?.role || translate('notAvailable')}
                                </Typography>
                            </Box>

                            <Button
                                onClick={handleLogout}
                                startIcon={<LogoutRoundedIcon fontSize="small" />}
                                variant="outlined"
                                color="inherit"
                            >
                                {translate('logout')}
                            </Button>
                        </Stack>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Outlet />
            </Container>
        </Box>
    );
}