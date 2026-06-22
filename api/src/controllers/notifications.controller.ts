import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { NotificationModel } from '../models/notification.model.js';
import { UserModel, UserRole } from '../models/user.model.js';

class NotificationsController {
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

    public getNotifications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const notifications = await NotificationModel.find({
                recipient: req.user.userId
            })
                .populate('recipient', 'firstName lastName email role')
                .populate('sender', 'firstName lastName email role')
                .populate('project', 'name status deadline')
                .populate('task', 'title status priority')
                .sort({ createdAt: -1 });

            return res.status(HttpCode.OK).json({
                notifications
            });
        } catch (error) {
            return next(error);
        }
    };

    public createNotification = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            if (req.user.role !== UserRole.ADMINISTRATOR) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Only administrators can create manual notifications'
                    })
                );
            }

            const { recipientId, projectId, taskId, type, title, message } = req.body;

            if (!Types.ObjectId.isValid(recipientId)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Invalid recipient id'
                    })
                );
            }

            const recipient = await UserModel.findById(recipientId);

            if (!recipient) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Recipient not found'
                    })
                );
            }

            const notification = await NotificationModel.create({
                recipient: recipientId,
                sender: req.user.userId,
                project: projectId || null,
                task: taskId || null,
                type,
                title,
                message
            });

            const populatedNotification = await NotificationModel.findById(notification._id)
                .populate('recipient', 'firstName lastName email role')
                .populate('sender', 'firstName lastName email role')
                .populate('project', 'name status deadline')
                .populate('task', 'title status priority');

            return res.status(HttpCode.CREATED).json({
                message: 'Notification created successfully',
                notification: populatedNotification
            });
        } catch (error) {
            return next(error);
        }
    };

    public markAsRead = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const notificationId = this.getObjectIdParam(req, 'notificationId');

            const notification = await NotificationModel.findById(notificationId);

            if (!notification) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Notification not found'
                    })
                );
            }

            if (notification.recipient.toString() !== req.user.userId) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            notification.isRead = true;
            await notification.save();

            return res.status(HttpCode.OK).json({
                message: 'Notification marked as read',
                notification
            });
        } catch (error) {
            return next(error);
        }
    };

    public markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            await NotificationModel.updateMany(
                {
                    recipient: req.user.userId,
                    isRead: false
                },
                {
                    isRead: true
                }
            );

            return res.status(HttpCode.OK).json({
                message: 'All notifications marked as read'
            });
        } catch (error) {
            return next(error);
        }
    };

    public deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const notificationId = this.getObjectIdParam(req, 'notificationId');

            const notification = await NotificationModel.findById(notificationId);

            if (!notification) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Notification not found'
                    })
                );
            }

            if (notification.recipient.toString() !== req.user.userId) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            await NotificationModel.findByIdAndDelete(notificationId);

            return res.status(HttpCode.OK).json({
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const notificationsController = new NotificationsController();