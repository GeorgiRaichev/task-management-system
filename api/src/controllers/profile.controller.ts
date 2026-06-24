import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { UserModel } from '../models/user.model.js';

class ProfileController {
    public getProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const user = await UserModel.findById(req.user.userId);

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

    public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const { firstName, lastName, email } = req.body;

            if (!firstName || !lastName || !email) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'First name, last name and email are required'
                    })
                );
            }

            const existingUser = await UserModel.findOne({
                email: email.toLowerCase().trim(),
                _id: { $ne: req.user.userId }
            });

            if (existingUser) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Email is already used'
                    })
                );
            }

            const user = await UserModel.findByIdAndUpdate(
                req.user.userId,
                {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.toLowerCase().trim()
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'User not found'
                    })
                );
            }

            return res.status(HttpCode.OK).json({
                message: 'Profile updated successfully',
                user
            });
        } catch (error) {
            return next(error);
        }
    };

    public updatePassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Current password and new password are required'
                    })
                );
            }

            if (newPassword.length < 6) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'New password must be at least 6 characters'
                    })
                );
            }

            const user = await UserModel.findById(req.user.userId).select('+password');

            if (!user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'User not found'
                    })
                );
            }

            const isPasswordValid = await user.comparePassword(currentPassword);

            if (!isPasswordValid) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Current password is incorrect'
                    })
                );
            }

            user.password = newPassword;

            await user.save();

            const updatedUser = await UserModel.findById(req.user.userId);

            return res.status(HttpCode.OK).json({
                message: 'Password updated successfully',
                user: updatedUser
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const profileController = new ProfileController();