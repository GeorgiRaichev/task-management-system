import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { ProjectGroupModel } from '../models/projectGroup.model.js';
import { ProjectModel } from '../models/project.model.js';
import { TaskActivityModel } from '../models/taskActivity.model.js';
import { TaskModel } from '../models/task.model.js';
import { UserRole } from '../models/user.model.js';

class TaskActivitiesController {
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

    private async canAccessTask(req: Request, taskId: string) {
        const task = await TaskModel.findById(taskId);

        if (!task) {
            throw new AppError({
                httpCode: HttpCode.NOT_FOUND,
                description: 'Task not found'
            });
        }

        const project = await ProjectModel.findById(task.project);

        if (!project) {
            throw new AppError({
                httpCode: HttpCode.NOT_FOUND,
                description: 'Project not found'
            });
        }

        if (req.user?.role === UserRole.ADMINISTRATOR) {
            return true;
        }

        if (project.createdBy.toString() === req.user?.userId) {
            return true;
        }

        if (task.assignedTo?.toString() === req.user?.userId) {
            return true;
        }

        const group = await ProjectGroupModel.exists({
            project: project._id,
            'members.user': req.user?.userId
        });

        return Boolean(group);
    }

    public getTaskActivities = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const taskId = this.getObjectIdParam(req, 'taskId');
            const hasAccess = await this.canAccessTask(req, taskId);

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const activities = await TaskActivityModel.find({ task: taskId })
                .populate('task', 'title status priority')
                .populate('project', 'name status')
                .populate('user', 'firstName lastName email role')
                .sort({ createdAt: -1 });

            return res.status(HttpCode.OK).json({
                activities
            });
        } catch (error) {
            return next(error);
        }
    };

    public createActivity = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const taskId = this.getObjectIdParam(req, 'taskId');
            const hasAccess = await this.canAccessTask(req, taskId);

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const task = await TaskModel.findById(taskId);

            if (!task) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Task not found'
                    })
                );
            }

            const activity = await TaskActivityModel.create({
                task: taskId,
                project: task.project,
                user: req.user.userId,
                action: req.body.action,
                message: req.body.message,
                changes: req.body.changes || {}
            });

            const populatedActivity = await TaskActivityModel.findById(activity._id)
                .populate('task', 'title status priority')
                .populate('project', 'name status')
                .populate('user', 'firstName lastName email role');

            return res.status(HttpCode.CREATED).json({
                message: 'Task activity created successfully',
                activity: populatedActivity
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const taskActivitiesController = new TaskActivitiesController();