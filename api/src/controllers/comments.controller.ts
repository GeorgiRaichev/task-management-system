import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { CommentModel } from '../models/comment.model.js';
import { ProjectGroupModel } from '../models/projectGroup.model.js';
import { ProjectModel } from '../models/project.model.js';
import { TaskActivityAction } from '../models/taskActivity.model.js';
import { TaskModel } from '../models/task.model.js';
import { UserRole } from '../models/user.model.js';
import { createTaskActivity } from '../services/taskActivity.service.js';

class CommentsController {
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
            return {
                hasAccess: true,
                task,
                project
            };
        }

        if (project.createdBy.toString() === req.user?.userId) {
            return {
                hasAccess: true,
                task,
                project
            };
        }

        if (task.assignedTo?.toString() === req.user?.userId) {
            return {
                hasAccess: true,
                task,
                project
            };
        }

        const group = await ProjectGroupModel.exists({
            project: project._id,
            'members.user': req.user?.userId
        });

        return {
            hasAccess: Boolean(group),
            task,
            project
        };
    }

    private canEditComment(req: Request, authorId: string) {
        return authorId === req.user?.userId;
    }

    private canDeleteComment(req: Request, authorId: string) {
        if (req.user?.role === UserRole.ADMINISTRATOR) {
            return true;
        }

        return authorId === req.user?.userId;
    }

    public getTaskComments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const taskId = this.getObjectIdParam(req, 'taskId');
            const { hasAccess } = await this.canAccessTask(req, taskId);

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const comments = await CommentModel.find({ task: taskId })
                .populate('task', 'title status priority')
                .populate('project', 'name status')
                .populate('author', 'firstName lastName email role')
                .sort({ createdAt: -1 });

            return res.status(HttpCode.OK).json({
                comments
            });
        } catch (error) {
            return next(error);
        }
    };

    public createComment = async (req: Request, res: Response, next: NextFunction) => {
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
            const { hasAccess, task, project } = await this.canAccessTask(req, taskId);

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const comment = await CommentModel.create({
                task: task._id,
                project: project._id,
                author: req.user.userId,
                content: req.body.content
            });

            await createTaskActivity({
                taskId: task._id.toString(),
                projectId: project._id.toString(),
                userId: req.user.userId,
                action: TaskActivityAction.COMMENT_ADDED,
                message: 'Comment added',
                changes: {
                    content: comment.content
                }
            });

            const populatedComment = await CommentModel.findById(comment._id)
                .populate('task', 'title status priority')
                .populate('project', 'name status')
                .populate('author', 'firstName lastName email role');

            return res.status(HttpCode.CREATED).json({
                message: 'Comment created successfully',
                comment: populatedComment
            });
        } catch (error) {
            return next(error);
        }
    };

    public getComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const commentId = this.getObjectIdParam(req, 'commentId');

            const comment = await CommentModel.findById(commentId)
                .populate('task', 'title status priority')
                .populate('project', 'name status createdBy')
                .populate('author', 'firstName lastName email role');

            if (!comment) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Comment not found'
                    })
                );
            }

            const taskId = comment.task.toString();
            const { hasAccess } = await this.canAccessTask(req, taskId);

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            return res.status(HttpCode.OK).json({
                comment
            });
        } catch (error) {
            return next(error);
        }
    };

    public updateComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const commentId = this.getObjectIdParam(req, 'commentId');
            const comment = await CommentModel.findById(commentId);

            if (!comment) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Comment not found'
                    })
                );
            }

            const { hasAccess } = await this.canAccessTask(req, comment.task.toString());

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            if (!this.canEditComment(req, comment.author.toString())) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const updatedComment = await CommentModel.findByIdAndUpdate(
                commentId,
                {
                    content: req.body.content
                },
                {
                    new: true,
                    runValidators: true
                }
            )
                .populate('task', 'title status priority')
                .populate('project', 'name status')
                .populate('author', 'firstName lastName email role');

            return res.status(HttpCode.OK).json({
                message: 'Comment updated successfully',
                comment: updatedComment
            });
        } catch (error) {
            return next(error);
        }
    };

    public deleteComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const commentId = this.getObjectIdParam(req, 'commentId');
            const comment = await CommentModel.findById(commentId);

            if (!comment) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Comment not found'
                    })
                );
            }

            const { hasAccess } = await this.canAccessTask(req, comment.task.toString());

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            if (!this.canDeleteComment(req, comment.author.toString())) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            await CommentModel.findByIdAndDelete(commentId);

            return res.status(HttpCode.OK).json({
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const commentsController = new CommentsController();