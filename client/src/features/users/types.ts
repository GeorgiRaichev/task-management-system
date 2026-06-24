import type { User, UserRole } from '../auth/types';

export type UsersResponse = {
    users: User[];
};

export type UserResponse = {
    user: User;
};

export type UserMutationResponse = {
    message: string;
    user: User;
};

export type CreateUserRequest = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
};

export type UpdateUserRequest = {
    userId: string;
    data: Partial<CreateUserRequest>;
};