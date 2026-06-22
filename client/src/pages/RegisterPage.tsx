import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    InputAdornment,
    Stack,
    TextField,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';

import { useRegisterMutation } from '../features/auth/authApi';
import { useTranslate } from '../hooks/useTranslate';
import { connectSocket } from '../services/socket';

export default function RegisterPage() {
    const theme = useTheme();
    const translate = useTranslate();
    const navigate = useNavigate();
    const [register, { isLoading }] = useRegisterMutation();
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [event.target.name]: event.target.value
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        try {
            const result = await register(formData).unwrap();
            connectSocket(result.accessToken);
            navigate('/dashboard');
        } catch {
            setError(translate('registrationFailed'));
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    md: '0.95fr 1.05fr'
                },
                background:
                    'radial-gradient(circle at top right, rgba(15, 118, 110, 0.22), transparent 34%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    placeItems: 'center',
                    p: {
                        xs: 2,
                        md: 6
                    }
                }}
            >
                <Card
                    sx={{
                        width: '100%',
                        maxWidth: 500,
                        p: {
                            xs: 3,
                            sm: 4.5
                        },
                        borderRadius: 6,
                        boxShadow: '0 28px 70px rgba(15, 23, 42, 0.16)'
                    }}
                >
                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <Stack spacing={1.2} sx={{ alignItems: 'center', textAlign: 'center' }}>
                                <Box
                                    sx={{
                                        width: 58,
                                        height: 58,
                                        borderRadius: 4,
                                        display: 'grid',
                                        placeItems: 'center',
                                        color: 'common.white',
                                        background:
                                            'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
                                        boxShadow: '0 18px 32px rgba(15, 118, 110, 0.24)'
                                    }}
                                >
                                    <TaskAltRoundedIcon />
                                </Box>

                                <Typography variant="h4">{translate('register')}</Typography>

                                <Typography color="text.secondary">
                                    {translate('createAccountSubtitle')}
                                </Typography>
                            </Stack>

                            {error && <Alert severity="error">{error}</Alert>}

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: '1fr 1fr'
                                    },
                                    gap: 2
                                }}
                            >
                                <TextField
                                    name="firstName"
                                    label={translate('firstName')}
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    fullWidth
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonRoundedIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />

                                <TextField
                                    name="lastName"
                                    label={translate('lastName')}
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    fullWidth
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <BadgeRoundedIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />
                            </Box>

                            <TextField
                                name="email"
                                label={translate('email')}
                                value={formData.email}
                                onChange={handleChange}
                                fullWidth
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailRoundedIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <TextField
                                name="password"
                                label={translate('password')}
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                fullWidth
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockRoundedIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isLoading}
                                endIcon={<ArrowForwardRoundedIcon />}
                                sx={{
                                    py: 1.45,
                                    fontSize: 16,
                                    background:
                                        'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
                                    boxShadow: '0 16px 28px rgba(15, 118, 110, 0.22)'
                                }}
                            >
                                {translate('createAccountAction')}
                            </Button>

                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                            >
                                <Typography color="text.secondary">
                                    {translate('alreadyHaveAccount')}
                                </Typography>

                                <Button
                                    onClick={() => navigate('/login')}
                                    sx={{
                                        color: theme.palette.primary.main
                                    }}
                                >
                                    {translate('login')}
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Card>
            </Box>

            <Box
                sx={{
                    display: {
                        xs: 'none',
                        md: 'flex'
                    },
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 6
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 620,
                        minHeight: 620,
                        borderRadius: 7,
                        p: 6,
                        color: 'common.white',
                        position: 'relative',
                        overflow: 'hidden',
                        background:
                            'linear-gradient(135deg, #0f172a 0%, #0f766e 52%, #2563eb 100%)',
                        boxShadow: '0 34px 90px rgba(15, 23, 42, 0.28)'
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: 280,
                            height: 280,
                            borderRadius: '50%',
                            left: -95,
                            top: -95,
                            bgcolor: alpha('#ffffff', 0.12)
                        }}
                    />

                    <Box
                        sx={{
                            position: 'absolute',
                            width: 240,
                            height: 240,
                            borderRadius: '50%',
                            right: -80,
                            bottom: -80,
                            bgcolor: alpha('#ffffff', 0.1)
                        }}
                    />

                    <Stack
                        spacing={4}
                        sx={{
                            position: 'relative',
                            zIndex: 1,
                            height: '100%',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Stack spacing={2}>
                            <Box
                                sx={{
                                    width: 58,
                                    height: 58,
                                    borderRadius: 4,
                                    display: 'grid',
                                    placeItems: 'center',
                                    bgcolor: alpha('#ffffff', 0.16),
                                    border: `1px solid ${alpha('#ffffff', 0.22)}`
                                }}
                            >
                                <GroupsRoundedIcon fontSize="large" />
                            </Box>

                            <Box>
                                <Typography variant="h4">
                                    {translate('authWelcomeTitle')}
                                </Typography>

                                <Typography
                                    sx={{
                                        mt: 2,
                                        maxWidth: 460,
                                        opacity: 0.82,
                                        fontSize: 18,
                                        lineHeight: 1.7
                                    }}
                                >
                                    {translate('authWelcomeSubtitle')}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack spacing={2}>
                            {[
                                {
                                    icon: <GroupsRoundedIcon />,
                                    text: translate('teamCollaboration')
                                },
                                {
                                    icon: <TaskAltRoundedIcon />,
                                    text: translate('manageProjects')
                                },
                                {
                                    icon: <NotificationsActiveRoundedIcon />,
                                    text: translate('realTimeUpdates')
                                }
                            ].map((item) => (
                                <Stack
                                    key={item.text}
                                    direction="row"
                                    spacing={1.5}
                                    sx={{
                                        alignItems: 'center',
                                        p: 2,
                                        borderRadius: 4,
                                        bgcolor: alpha('#ffffff', 0.12),
                                        border: `1px solid ${alpha('#ffffff', 0.16)}`
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 3,
                                            display: 'grid',
                                            placeItems: 'center',
                                            bgcolor: alpha('#ffffff', 0.16)
                                        }}
                                    >
                                        {item.icon}
                                    </Box>

                                    <Typography sx={{ fontWeight: 800 }}>{item.text}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}