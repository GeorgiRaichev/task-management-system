declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: 'registered_user' | 'project_manager' | 'administrator';
            };
        }
    }
}

export {};