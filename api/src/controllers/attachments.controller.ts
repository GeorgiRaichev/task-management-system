import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { AttachmentModel } from '../models/attachment.model.js';
import { ProjectGroupModel } from '../models/projectGroup.model.js';
import { ProjectModel } from '../models/project.model.js';
import { TaskActivityAction } from '../models/taskActivity.model.js';
import { TaskModel } from '../models/task.model.js';
import { UserRole } from '../models/user.model.js';
import { createTaskActivity } from '../services/taskActivity.service.js';

class AttachmentsController {
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
            return { hasAccess: true, task, project };
        }

        if (project.createdBy.toString() === req.user?.userId) {
            return { hasAccess: true, task, project };
        }

        if (task.assignedTo?.toString() === req.user?.userId) {
            return { hasAccess: true, task, project };
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

    public getTaskAttachments = async (req: Request, res: Response, next: NextFunction) => {
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

            const attachments = await AttachmentModel.find({ task: taskId })
                .populate('task', 'title status priority')
                .populate('project', 'name status')
                .populate('uploadedBy', 'firstName lastName email role')
                .sort({ createdAt: -1 });

            return res.status(HttpCode.OK).json({
                attachments
            });
        } catch (error) {
            return next(error);
        }
    };

    public uploadAttachment = async (req: Request, res: Response, next: NextFunction) => {
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

            if (!req.file) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'File is required'
                    })
                );
            }

            const attachment = await AttachmentModel.create({
                task: task._id,
                project: project._id,
                uploadedBy: req.user.userId,
                originalName: req.file.originalname,
                fileName: req.file.filename,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: `/uploads/${req.file.filename}`
            });

            await createTaskActivity({
                taskId: task._id.toString(),
                projectId: project._id.toString(),
                userId: req.user.userId,
                action: TaskActivityAction.ATTACHMENT_UPLOADED,
                message: 'Attachment uploaded',
                changes: {
                    originalName: attachment.originalName,
                    fileName: attachment.fileName,
                    size: attachment.size
                }
            });

            const populatedAttachment = await AttachmentModel.findById(attachment._id)
                .populate('task', 'title status priority')
                .populate('project', 'name status')
                .populate('uploadedBy', 'firstName lastName email role');

            return res.status(HttpCode.CREATED).json({
                message: 'Attachment uploaded successfully',
                attachment: populatedAttachment
            });
        } catch (error) {
            return next(error);
        }
    };

    public getAttachment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const attachmentId = this.getObjectIdParam(req, 'attachmentId');

            const attachment = await AttachmentModel.findById(attachmentId)
                .populate('task', 'title status priority')
                .populate('project', 'name status')
                .populate('uploadedBy', 'firstName lastName email role');

            if (!attachment) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Attachment not found'
                    })
                );
            }

            const { hasAccess } = await this.canAccessTask(req, attachment.task._id.toString());

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            return res.status(HttpCode.OK).json({
                attachment
            });
        } catch (error) {
            return next(error);
        }
    };

    public deleteAttachment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const attachmentId = this.getObjectIdParam(req, 'attachmentId');

            const attachment = await AttachmentModel.findById(attachmentId);

            if (!attachment) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Attachment not found'
                    })
                );
            }

            const { hasAccess } = await this.canAccessTask(req, attachment.task.toString());

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const filePath = path.join(process.cwd(), attachment.path);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await AttachmentModel.findByIdAndDelete(attachmentId);

            return res.status(HttpCode.OK).json({
                message: 'Attachment deleted successfully'
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const attachmentsController = new AttachmentsController();