import type { User } from '../auth/types';

export type ProfileResponse = {
    user: User;
};

export type UpdateProfileRequest = {
    firstName: string;
    lastName: string;
    email: string;
};

export type UpdatePasswordRequest = {
    currentPassword: string;
    newPassword: string;
};

export type ProfileMutationResponse = {
    message: string;
    user: User;
};