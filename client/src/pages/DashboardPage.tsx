import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Stack,
    Typography,
    alpha
} from '@mui/material';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '../app/hooks';
import { UserRole, type UserRole as UserRoleType } from '../features/auth/types';
import { useGetNotificationsQuery } from '../features/notifications/notificationsApi';
import { useGetProjectsQuery } from '../features/projects/projectsApi';
import { TaskStatus, type Task } from '../features/tasks/types';
import { useLazyGetProjectTasksQuery } from '../features/tasks/tasksApi';
import { useTranslate } from '../hooks/useTranslate';
import type { TranslationKey } from '../i18n/translations';

type StatCardProps = {
    title: string;
    value: string;
    icon: ReactNode;
    gradient: string;
    loading?: boolean;
};

const roleLabels: Record<UserRoleType, TranslationKey> = {
    [UserRole.REGISTERED_USER]: 'registered_user',
    [UserRole.PROJECT_MANAGER]: 'project_manager',
    [UserRole.ADMINISTRATOR]: 'administrator'
};

function StatCard({ title, value, icon, gradient, loading }: StatCardProps) {
    return (
        <Card sx={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
            <CardContent sx={{ p: 3 }}>
                <Stack
                    direction="row"
                    sx={{
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}
                >
                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 700 }}
                        >
                            {title}
                        </Typography>

                        {loading ? (
                            <CircularProgress size={28} sx={{ mt: 1.5 }} />
                        ) : (
                            <Typography variant="h4" sx={{ mt: 1 }}>
                                {value}
                            </Typography>
                        )}
                    </Box>

                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 4,
                            display: 'grid',
                            placeItems: 'center',
                            color: 'common.white',
                            background: gradient,
                            boxShadow: '0 14px 28px rgba(15, 23, 42, 0.18)'
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const translate = useTranslate();
    const { user } = useAppSelector((state) => state.auth);

    const { data: projectsData, isLoading: isProjectsLoading } = useGetProjectsQuery(undefined, {
        refetchOnMountOrArgChange: true
    });

    const { data: notificationsData, isLoading: isNotificationsLoading } =
        useGetNotificationsQuery(undefined, {
            refetchOnMountOrArgChange: true
        });

    const [getProjectTasks] = useLazyGetProjectTasksQuery();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isTasksLoading, setIsTasksLoading] = useState(false);

    const projects = useMemo(() => projectsData?.projects || [], [projectsData?.projects]);
    const notifications = notificationsData?.notifications || [];

    useEffect(() => {
        let isMounted = true;

        const fetchTasks = async () => {
            if (projects.length === 0) {
                setTasks([]);
                return;
            }

            setIsTasksLoading(true);

            try {
                const results = await Promise.all(
                    projects.map((project) => getProjectTasks(project._id).unwrap())
                );

                if (isMounted) {
                    setTasks(results.flatMap((result) => result.tasks));
                }
            } catch {
                if (isMounted) {
                    setTasks([]);
                }
            } finally {
                if (isMounted) {
                    setIsTasksLoading(false);
                }
            }
        };

        fetchTasks();

        return () => {
            isMounted = false;
        };
    }, [getProjectTasks, projects]);

    const fullName = user ? `${user.firstName} ${user.lastName}` : translate('notAvailable');
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'N/A';
    const userRole = user ? translate(roleLabels[user.role]) : translate('notAvailable');

    const activeTasksCount = tasks.filter((task) => task.status !== TaskStatus.DONE).length;
    const completedTasksCount = tasks.filter((task) => task.status === TaskStatus.DONE).length;
    const unreadNotificationsCount = notifications.filter((notification) => !notification.isRead).length;

    const stats = [
        {
            title: translate('totalProjects'),
            value: String(projects.length),
            icon: <FolderRoundedIcon />,
            gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
            loading: isProjectsLoading
        },
        {
            title: translate('activeTasks'),
            value: String(activeTasksCount),
            icon: <AssignmentTurnedInRoundedIcon />,
            gradient: 'linear-gradient(135deg, #0f766e 0%, #5eead4 100%)',
            loading: isTasksLoading
        },
        {
            title: translate('completedTasks'),
            value: String(completedTasksCount),
            icon: <TaskAltRoundedIcon />,
            gradient: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
            loading: isTasksLoading
        },
        {
            title: translate('unreadNotifications'),
            value: String(unreadNotificationsCount),
            icon: <NotificationsRoundedIcon />,
            gradient: 'linear-gradient(135deg, #f97316 0%, #fdba74 100%)',
            loading: isNotificationsLoading
        }
    ];

    return (
        <Stack spacing={4}>
            <Box
                sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 5,
                    color: 'common.white',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #0f766e 100%)',
                    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.22)'
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        right: -90,
                        top: -90,
                        width: 240,
                        height: 240,
                        borderRadius: '50%',
                        bgcolor: alpha('#ffffff', 0.14)
                    }}
                />

                <Box
                    sx={{
                        position: 'absolute',
                        left: '45%',
                        bottom: -110,
                        width: 260,
                        height: 260,
                        borderRadius: '50%',
                        bgcolor: alpha('#ffffff', 0.1)
                    }}
                />

                <Stack
                    spacing={3}
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' }
                    }}
                >
                    <Box>
                        <Typography sx={{ opacity: 0.78, fontWeight: 700 }}>
                            {translate('welcomeBack')}
                        </Typography>

                        <Typography variant="h4" sx={{ mt: 1 }}>
                            {fullName}
                        </Typography>

                        <Typography sx={{ mt: 1, opacity: 0.82 }}>
                            {user?.email || translate('notAvailable')}
                        </Typography>
                    </Box>

                    <Avatar
                        sx={{
                            width: 82,
                            height: 82,
                            bgcolor: alpha('#ffffff', 0.18),
                            border: `1px solid ${alpha('#ffffff', 0.32)}`,
                            fontSize: 28,
                            fontWeight: 900
                        }}
                    >
                        {initials}
                    </Avatar>
                </Stack>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)'
                    },
                    gap: 3
                }}
            >
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: '7fr 5fr'
                    },
                    gap: 3
                }}
            >
                <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6">{translate('accountInfo')}</Typography>

                        <Stack spacing={2.2} sx={{ mt: 3 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    {translate('currentUser')}
                                </Typography>

                                <Typography sx={{ fontWeight: 800 }}>{fullName}</Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    {translate('email')}
                                </Typography>

                                <Typography sx={{ fontWeight: 800 }}>
                                    {user?.email || translate('notAvailable')}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    {translate('role')}
                                </Typography>

                                <Typography sx={{ fontWeight: 800 }}>{userRole}</Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6">{translate('quickActions')}</Typography>

                        <Stack spacing={1.5} sx={{ mt: 3 }}>
                            <Button
                                onClick={() => navigate('/projects')}
                                variant="contained"
                                endIcon={<ArrowForwardRoundedIcon />}
                                sx={{ justifyContent: 'space-between', py: 1.4 }}
                            >
                                {translate('manageProjects')}
                            </Button>

                            {user?.role === UserRole.ADMINISTRATOR && (
                                <Button
                                    onClick={() => navigate('/users')}
                                    variant="outlined"
                                    endIcon={<ArrowForwardRoundedIcon />}
                                    sx={{ justifyContent: 'space-between', py: 1.4 }}
                                >
                                    {translate('viewUsers')}
                                </Button>
                            )}

                            <Button
                                onClick={() => navigate('/notifications')}
                                variant="outlined"
                                color="secondary"
                                endIcon={<ArrowForwardRoundedIcon />}
                                sx={{ justifyContent: 'space-between', py: 1.4 }}
                            >
                                {translate('checkNotifications')}
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Stack>
    );
}