export const UserRole = {
    REGISTERED_USER: 'registered_user',
    PROJECT_MANAGER: 'project_manager',
    ADMINISTRATOR: 'administrator'
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type User = {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type AuthResponse = {
    message: string;
    accessToken: string;
    user: User;
};

export type MeResponse = {
    user: User;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type RegisterRequest = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};