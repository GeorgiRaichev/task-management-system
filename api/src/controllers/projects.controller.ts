import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { NotificationType } from '../models/notification.model.js';
import { ProjectModel } from '../models/project.model.js';
import { UserRole } from '../models/user.model.js';
import { createNotification } from '../services/notification.service.js';
import { getProjectParticipantIds, getUserProjectIds } from '../utils/project-participants.js';

class ProjectsController {
    private getProjectId(req: Request) {
        const { projectId } = req.params;

        if (!projectId || Array.isArray(projectId) || !Types.ObjectId.isValid(projectId)) {
            throw new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: 'Invalid project id'
            });
        }

        return projectId;
    }

    private async notifyProjectParticipants(projectId: string, senderId: string, projectName: string) {
        const participantIds = await getProjectParticipantIds(projectId);
        const recipients = participantIds.filter((participantId) => participantId !== senderId);

        await Promise.all(
            recipients.map((recipientId) =>
                createNotification({
                    recipientId,
                    senderId,
                    projectId,
                    type: NotificationType.GENERAL,
                    title: 'Project updated',
                    message: `Project "${projectName}" was updated.`
                })
            )
        );
    }

    public getProjects = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const userProjectIds = await getUserProjectIds(req.user.userId);

            const filter =
                req.user.role === UserRole.ADMINISTRATOR
                    ? {}
                    : {
                          $or: [
                              { createdBy: req.user.userId },
                              { _id: { $in: userProjectIds } }
                          ]
                      };

            const projects = await ProjectModel.find(filter)
                .populate('createdBy', 'firstName lastName email role')
                .sort({ createdAt: -1 });

            return res.status(HttpCode.OK).json({
                projects
            });
        } catch (error) {
            return next(error);
        }
    };

    public getProject = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const projectId = this.getProjectId(req);

            const project = await ProjectModel.findById(projectId);

            if (!project) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Project not found'
                    })
                );
            }

            const participantIds = await getProjectParticipantIds(projectId);

            const hasAccess =
                req.user.role === UserRole.ADMINISTRATOR ||
                project.createdBy.toString() === req.user.userId ||
                participantIds.includes(req.user.userId);

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const populatedProject = await ProjectModel.findById(projectId).populate(
                'createdBy',
                'firstName lastName email role'
            );

            return res.status(HttpCode.OK).json({
                project: populatedProject
            });
        } catch (error) {
            return next(error);
        }
    };

    public createProject = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const project = await ProjectModel.create({
                ...req.body,
                createdBy: req.user.userId
            });

            const populatedProject = await ProjectModel.findById(project._id).populate(
                'createdBy',
                'firstName lastName email role'
            );

            return res.status(HttpCode.CREATED).json({
                message: 'Project created successfully',
                project: populatedProject
            });
        } catch (error) {
            return next(error);
        }
    };

    public updateProject = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const projectId = this.getProjectId(req);

            const project = await ProjectModel.findById(projectId);

            if (!project) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Project not found'
                    })
                );
            }

            if (
                req.user.role !== UserRole.ADMINISTRATOR &&
                project.createdBy.toString() !== req.user.userId
            ) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const updatedProject = await ProjectModel.findByIdAndUpdate(projectId, req.body, {
                new: true,
                runValidators: true
            }).populate('createdBy', 'firstName lastName email role');

            if (updatedProject) {
                await this.notifyProjectParticipants(
                    projectId,
                    req.user.userId,
                    updatedProject.name
                );
            }

            return res.status(HttpCode.OK).json({
                message: 'Project updated successfully',
                project: updatedProject
            });
        } catch (error) {
            return next(error);
        }
    };

    public deleteProject = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const projectId = this.getProjectId(req);

            const project = await ProjectModel.findById(projectId);

            if (!project) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Project not found'
                    })
                );
            }

            if (
                req.user.role !== UserRole.ADMINISTRATOR &&
                project.createdBy.toString() !== req.user.userId
            ) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            await ProjectModel.findByIdAndDelete(projectId);

            return res.status(HttpCode.OK).json({
                message: 'Project deleted successfully'
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const projectsController = new ProjectsController();