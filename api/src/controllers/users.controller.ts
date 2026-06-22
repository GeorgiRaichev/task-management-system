import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { UserModel, UserRole } from '../models/user.model.js';

class UsersController {
    private getObjectIdParam(req: Request, paramName: string) {
        const value = req.params[paramName];

        if (!value || Array.isArray(value) || !Types.ObjectId.isValid(value)) {
            throw new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: `Invalid ${paramName}`
            });
        }

        return value;
    }

    private isAdministrator(req: Request) {
        return req.user?.role === UserRole.ADMINISTRATOR;
    }

    public getUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (
                req.user?.role !== UserRole.ADMINISTRATOR &&
                req.user?.role !== UserRole.PROJECT_MANAGER
            ) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const { search, role, isActive } = req.query;

            const filter: Record<string, unknown> = {};

            if (typeof search === 'string' && search.trim()) {
                filter.$or = [
                    { firstName: { $regex: search.trim(), $options: 'i' } },
                    { lastName: { $regex: search.trim(), $options: 'i' } },
                    { email: { $regex: search.trim(), $options: 'i' } }
                ];
            }

            if (typeof role === 'string' && Object.values(UserRole).includes(role as UserRole)) {
                filter.role = role;
            }

            if (typeof isActive === 'string') {
                filter.isActive = isActive === 'true';
            }

            const users = await UserModel.find(filter).sort({ createdAt: -1 });

            return res.status(HttpCode.OK).json({
                users
            });
        } catch (error) {
            return next(error);
        }
    };

    public getUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = this.getObjectIdParam(req, 'userId');

            if (!this.isAdministrator(req) && req.user?.userId !== userId) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const user = await UserModel.findById(userId);

            if (!user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'User not found'
                    })
                );
            }

            return res.status(HttpCode.OK).json({
                user
            });
        } catch (error) {
            return next(error);
        }
    };

    public createUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!this.isAdministrator(req)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Only administrators can create users'
                    })
                );
            }

            const existingUser = await UserModel.findOne({ email: req.body.email });

            if (existingUser) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'User with this email already exists'
                    })
                );
            }

            const user = await UserModel.create({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password,
                role: req.body.role || UserRole.REGISTERED_USER,
                isActive: req.body.isActive ?? true
            });

            return res.status(HttpCode.CREATED).json({
                message: 'User created successfully',
                user
            });
        } catch (error) {
            return next(error);
        }
    };

    public updateUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = this.getObjectIdParam(req, 'userId');

            if (!this.isAdministrator(req) && req.user?.userId !== userId) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const user = await UserModel.findById(userId).select('+password');

            if (!user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'User not found'
                    })
                );
            }

            if (req.body.email && req.body.email !== user.email) {
                const existingUser = await UserModel.findOne({
                    email: req.body.email,
                    _id: { $ne: userId }
                });

                if (existingUser) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.BAD_REQUEST,
                            description: 'User with this email already exists'
                        })
                    );
                }

                user.email = req.body.email;
            }

            if (req.body.firstName) {
                user.firstName = req.body.firstName;
            }

            if (req.body.lastName) {
                user.lastName = req.body.lastName;
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            if (this.isAdministrator(req)) {
                if (req.body.role) {
                    user.role = req.body.role;
                }

                if (typeof req.body.isActive !== 'undefined') {
                    user.isActive = req.body.isActive;
                }
            }

            await user.save();

            const updatedUser = await UserModel.findById(userId);

            return res.status(HttpCode.OK).json({
                message: 'User updated successfully',
                user: updatedUser
            });
        } catch (error) {
            return next(error);
        }
    };

    public deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!this.isAdministrator(req)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Only administrators can delete users'
                    })
                );
            }

            const userId = this.getObjectIdParam(req, 'userId');

            if (req.user?.userId === userId) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Administrator cannot delete own account'
                    })
                );
            }

            const user = await UserModel.findById(userId);

            if (!user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'User not found'
                    })
                );
            }

            await UserModel.findByIdAndDelete(userId);

            return res.status(HttpCode.OK).json({
                message: 'User deleted successfully'
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const usersController = new UsersController();