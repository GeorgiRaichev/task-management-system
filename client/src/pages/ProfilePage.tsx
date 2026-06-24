import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CircularProgress,
    Stack,
    TextField,
    Typography,
    alpha
} from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

import { UserRole, type UserRole as UserRoleType } from '../features/auth/types';
import {
    useGetProfileQuery,
    useUpdatePasswordMutation,
    useUpdateProfileMutation
} from '../features/profile/profileApi';
import { useTranslate } from '../hooks/useTranslate';
import type { TranslationKey } from '../i18n/translations';
import { getApiErrorMessage } from '../utils/api-error';

type ProfileFormData = {
    firstName: string;
    lastName: string;
    email: string;
};

type PasswordFormData = {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
};

const initialPasswordForm: PasswordFormData = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
};

const roleLabels: Record<UserRoleType, TranslationKey> = {
    [UserRole.REGISTERED_USER]: 'registered_user',
    [UserRole.PROJECT_MANAGER]: 'project_manager',
    [UserRole.ADMINISTRATOR]: 'administrator'
};

export default function ProfilePage() {
    const translate = useTranslate();

    const { data, isLoading, isFetching } = useGetProfileQuery(undefined, {
        refetchOnMountOrArgChange: true
    });

    const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
    const [updatePassword, { isLoading: isUpdatingPassword }] = useUpdatePasswordMutation();

    const [profileForm, setProfileForm] = useState<ProfileFormData | null>(null);
    const [passwordForm, setPasswordForm] = useState<PasswordFormData>(initialPasswordForm);
    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const user = data?.user;

    const currentProfileForm = useMemo(
        () => ({
            firstName: profileForm?.firstName ?? user?.firstName ?? '',
            lastName: profileForm?.lastName ?? user?.lastName ?? '',
            email: profileForm?.email ?? user?.email ?? ''
        }),
        [profileForm, user]
    );

    const handleProfileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setProfileForm((prev) => ({
            firstName: prev?.firstName ?? user?.firstName ?? '',
            lastName: prev?.lastName ?? user?.lastName ?? '',
            email: prev?.email ?? user?.email ?? '',
            [name]: value
        }));
        setProfileError('');
        setProfileSuccess('');
    };

    const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setPasswordForm((prev) => ({
            ...prev,
            [name]: value
        }));
        setPasswordError('');
        setPasswordSuccess('');
    };

    const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProfileError('');
        setProfileSuccess('');

        try {
            await updateProfile(currentProfileForm).unwrap();
            setProfileForm(null);
            setProfileSuccess(translate('profileUpdated'));
        } catch (errorResponse) {
            setProfileError(getApiErrorMessage(errorResponse, translate('operationFailed')));
        }
    };

    const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setPasswordError(translate('passwordsDoNotMatch'));
            return;
        }

        try {
            await updatePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            }).unwrap();

            setPasswordForm(initialPasswordForm);
            setPasswordSuccess(translate('passwordUpdated'));
        } catch (errorResponse) {
            setPasswordError(getApiErrorMessage(errorResponse, translate('operationFailed')));
        }
    };

    if (isLoading || isFetching) {
        return (
            <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Stack spacing={3}>
            <Box
                sx={{
                    p: 3,
                    borderRadius: 5,
                    background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
                    color: 'common.white',
                    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)'
                }}
            >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 54,
                            height: 54,
                            borderRadius: 4,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha('#ffffff', 0.16),
                            border: `1px solid ${alpha('#ffffff', 0.24)}`
                        }}
                    >
                        <PersonRoundedIcon />
                    </Box>

                    <Box>
                        <Typography variant="h4">{translate('profile')}</Typography>
                        <Typography sx={{ opacity: 0.78 }}>
                            {translate('accountSettings')}
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: '1fr 1fr'
                    },
                    gap: 3
                }}
            >
                <Card sx={{ p: 3 }}>
                    <Box component="form" onSubmit={handleProfileSubmit}>
                        <Stack spacing={2.5}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                <PersonRoundedIcon color="primary" />

                                <Typography variant="h6">
                                    {translate('personalInformation')}
                                </Typography>
                            </Stack>

                            {profileError && <Alert severity="error">{profileError}</Alert>}
                            {profileSuccess && <Alert severity="success">{profileSuccess}</Alert>}

                            <TextField
                                name="firstName"
                                label={translate('firstName')}
                                value={currentProfileForm.firstName}
                                onChange={handleProfileChange}
                                fullWidth
                                required
                            />

                            <TextField
                                name="lastName"
                                label={translate('lastName')}
                                value={currentProfileForm.lastName}
                                onChange={handleProfileChange}
                                fullWidth
                                required
                            />

                            <TextField
                                name="email"
                                label={translate('email')}
                                value={currentProfileForm.email}
                                onChange={handleProfileChange}
                                fullWidth
                                required
                            />

                            <TextField
                                label={translate('role')}
                                value={
                                    user ? translate(roleLabels[user.role]) : translate('notAvailable')
                                }
                                fullWidth
                                disabled
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isUpdatingProfile}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                {translate('save')}
                            </Button>
                        </Stack>
                    </Box>
                </Card>

                <Card sx={{ p: 3 }}>
                    <Box component="form" onSubmit={handlePasswordSubmit}>
                        <Stack spacing={2.5}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                <LockRoundedIcon color="primary" />

                                <Typography variant="h6">
                                    {translate('changePassword')}
                                </Typography>
                            </Stack>

                            {passwordError && <Alert severity="error">{passwordError}</Alert>}
                            {passwordSuccess && <Alert severity="success">{passwordSuccess}</Alert>}

                            <TextField
                                name="currentPassword"
                                label={translate('currentPassword')}
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                fullWidth
                                required
                            />

                            <TextField
                                name="newPassword"
                                label={translate('newPassword')}
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                fullWidth
                                required
                            />

                            <TextField
                                name="confirmNewPassword"
                                label={translate('confirmNewPassword')}
                                type="password"
                                value={passwordForm.confirmNewPassword}
                                onChange={handlePasswordChange}
                                fullWidth
                                required
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isUpdatingPassword}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                {translate('save')}
                            </Button>
                        </Stack>
                    </Box>
                </Card>
            </Box>
        </Stack>
    );
}