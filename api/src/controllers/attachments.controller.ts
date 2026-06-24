import fs from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { taskAttachmentsUploadDirectory } from '../config/upload.js';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { AttachmentModel } from '../models/attachment.model.js';
import { NotificationType } from '../models/notification.model.js';
import { ProjectGroupMemberRole, ProjectGroupModel } from '../models/projectGroup.model.js';
import { ProjectModel } from '../models/project.model.js';
import { TaskModel } from '../models/task.model.js';
import { UserRole } from '../models/user.model.js';
import { createNotification } from '../services/notification.service.js';

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

    private async getTaskAccess(req: Request, taskId: string) {
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

        const projectGroup = await ProjectGroupModel.findOne({
            project: project._id
        });

        if (!projectGroup) {
            throw new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: 'Project must have a group before attachments can be used'
            });
        }

        if (req.user?.role === UserRole.ADMINISTRATOR) {
            return {
                hasAccess: true,
                canManage: true,
                task,
                project
            };
        }

        if (project.createdBy.toString() === req.user?.userId) {
            return {
                hasAccess: true,
                canManage: true,
                task,
                project
            };
        }

        const member = projectGroup.members.find(
            (currentMember) => currentMember.user.toString() === req.user?.userId
        );

        if (member) {
            return {
                hasAccess: true,
                canManage: member.role === ProjectGroupMemberRole.MANAGER,
                task,
                project
            };
        }

        if (task.assignedTo?.toString() === req.user?.userId) {
            return {
                hasAccess: true,
                canManage: false,
                task,
                project
            };
        }

        return {
            hasAccess: false,
            canManage: false,
            task,
            project
        };
    }

    private async notifyUsersForAttachment(
        taskId: string,
        projectId: string,
        assignedTo: string | null | undefined,
        createdBy: string | null | undefined,
        senderId: string,
        taskTitle: string
    ) {
        const recipientIds = new Set<string>();

        if (assignedTo) {
            recipientIds.add(assignedTo);
        }

        if (createdBy) {
            recipientIds.add(createdBy);
        }

        recipientIds.delete(senderId);

        await Promise.all(
            Array.from(recipientIds).map((recipientId) =>
                createNotification({
                    recipientId,
                    senderId,
                    projectId,
                    taskId,
                    type: NotificationType.ATTACHMENT_ADDED,
                    title: 'Attachment added',
                    message: `New attachment was added to task "${taskTitle}".`
                })
            )
        );
    }

    private async removeFile(fileName: string) {
        const filePath = path.join(taskAttachmentsUploadDirectory, fileName);

        await fs.unlink(filePath).catch(() => null);
    }

    public getTaskAttachments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const taskId = this.getObjectIdParam(req, 'taskId');
            const { hasAccess } = await this.getTaskAccess(req, taskId);

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const attachments = await AttachmentModel.find({
                task: taskId
            })
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

            if (!req.file) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'File is required'
                    })
                );
            }

            const taskId = this.getObjectIdParam(req, 'taskId');
            const { hasAccess, task, project } = await this.getTaskAccess(req, taskId);

            if (!hasAccess) {
                await this.removeFile(req.file.filename);

                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const attachment = await AttachmentModel.create({
                task: task._id,
                project: project._id,
                uploadedBy: req.user.userId,
                originalName: req.file.originalname,
                fileName: req.file.filename,
                fileUrl: `/uploads/task-attachments/${req.file.filename}`,
                mimeType: req.file.mimetype,
                size: req.file.size
            });

            await this.notifyUsersForAttachment(
                task._id.toString(),
                project._id.toString(),
                task.assignedTo?.toString(),
                task.createdBy.toString(),
                req.user.userId,
                task.title
            );

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

            const attachment = await AttachmentModel.findById(attachmentId);

            if (!attachment) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Attachment not found'
                    })
                );
            }

            const { hasAccess } = await this.getTaskAccess(req, attachment.task.toString());

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const populatedAttachment = await AttachmentModel.findById(attachmentId)
                .populate('task', 'title status priority')
                .populate('project', 'name status')
                .populate('uploadedBy', 'firstName lastName email role');

            return res.status(HttpCode.OK).json({
                attachment: populatedAttachment
            });
        } catch (error) {
            return next(error);
        }
    };

    public deleteAttachment = async (req: Request, res: Response, next: NextFunction) => {
        try {
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

            const { hasAccess, canManage } = await this.getTaskAccess(
                req,
                attachment.task.toString()
            );
            const isUploader = attachment.uploadedBy.toString() === req.user?.userId;

            if (!hasAccess || (!canManage && !isUploader)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            await AttachmentModel.findByIdAndDelete(attachmentId);
            await this.removeFile(attachment.fileName);

            return res.status(HttpCode.OK).json({
                message: 'Attachment deleted successfully'
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const attachmentsController = new AttachmentsController();