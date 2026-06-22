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
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '../features/auth/authApi';
import { useTranslate } from '../hooks/useTranslate';
import { connectSocket } from '../services/socket';

export default function LoginPage() {
    const theme = useTheme();
    const translate = useTranslate();
    const navigate = useNavigate();
    const [login, { isLoading }] = useLoginMutation();
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
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
            const result = await login(formData).unwrap();
            connectSocket(result.accessToken);
            navigate('/dashboard');
        } catch {
            setError(translate('invalidCredentials'));
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    md: '1.05fr 0.95fr'
                },
                background:
                    'radial-gradient(circle at top left, rgba(37, 99, 235, 0.22), transparent 34%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
            }}
        >
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
                            'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #0f766e 100%)',
                        boxShadow: '0 34px 90px rgba(15, 23, 42, 0.28)'
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: 280,
                            height: 280,
                            borderRadius: '50%',
                            right: -95,
                            top: -95,
                            bgcolor: alpha('#ffffff', 0.14)
                        }}
                    />

                    <Box
                        sx={{
                            position: 'absolute',
                            width: 220,
                            height: 220,
                            borderRadius: '50%',
                            left: -80,
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
                                <TaskAltRoundedIcon fontSize="large" />
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
                                    icon: <LockRoundedIcon />,
                                    text: translate('secureAccess')
                                },
                                {
                                    icon: <BoltRoundedIcon />,
                                    text: translate('realTimeUpdates')
                                },
                                {
                                    icon: <GroupsRoundedIcon />,
                                    text: translate('teamCollaboration')
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
                        maxWidth: 470,
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
                                            'linear-gradient(135deg, #2563eb 0%, #0f766e 100%)',
                                        boxShadow: '0 18px 32px rgba(37, 99, 235, 0.25)'
                                    }}
                                >
                                    <TaskAltRoundedIcon />
                                </Box>

                                <Typography variant="h4">{translate('login')}</Typography>

                                <Typography color="text.secondary">
                                    {translate('signInSubtitle')}
                                </Typography>
                            </Stack>

                            {error && <Alert severity="error">{error}</Alert>}

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
                                        'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    boxShadow: '0 16px 28px rgba(37, 99, 235, 0.22)'
                                }}
                            >
                                {translate('signInAction')}
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
                                    {translate('noAccount')}
                                </Typography>

                                <Button
                                    onClick={() => navigate('/register')}
                                    sx={{
                                        color: theme.palette.primary.main
                                    }}
                                >
                                    {translate('register')}
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Card>
            </Box>
        </Box>
    );
}