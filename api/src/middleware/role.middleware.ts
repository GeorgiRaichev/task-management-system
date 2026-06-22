import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { UserRole } from '../models/user.model.js';

export const authorizeRoles = (...roles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError({
                httpCode: HttpCode.UNAUTHORIZED,
                description: 'Unauthorized'
            }));
        }

        if (!roles.includes(req.user.role as UserRole)) {
            return next(new AppError({
                httpCode: HttpCode.FORBIDDEN,
                description: 'Access denied'
            }));
        }

        return next();
    };
};