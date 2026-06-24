import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { NotificationType } from '../models/notification.model.js';
import { ProjectGroupMemberRole, ProjectGroupModel } from '../models/projectGroup.model.js';
import { ProjectModel } from '../models/project.model.js';
import { TaskActivityAction } from '../models/taskActivity.model.js';
import { TaskModel, TaskStatus } from '../models/task.model.js';
import { UserModel, UserRole } from '../models/user.model.js';
import { createNotification } from '../services/notification.service.js';
import { createTaskActivity } from '../services/taskActivity.service.js';

class TasksController {
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

    private async canAssignUserToProject(projectId: string, userId: string) {
        const project = await this.getProjectOrFail(projectId);

        if (project.createdBy.toString() === userId) {
            return true;
        }

        const group = await ProjectGroupModel.exists({
            project: projectId,
            'members.user': userId
        });

        return Boolean(group);
    }

    private getReferenceId(value: unknown) {
        if (!value) {
            return null;
        }

        if (value instanceof Types.ObjectId) {
            return value.toString();
        }

        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'object' && '_id' in value) {
            const objectId = (value as { _id?: unknown })._id;

            if (objectId instanceof Types.ObjectId) {
                return objectId.toString();
            }

            if (typeof objectId === 'string') {
                return objectId;
            }

            return objectId ? String(objectId) : null;
        }

        return String(value);
    }

    private async getProjectOrFail(projectId: string) {
        const project = await ProjectModel.findById(projectId);

        if (!project) {
            throw new AppError({
                httpCode: HttpCode.NOT_FOUND,
                description: 'Project not found'
            });
        }

        return project;
    }

    private async getTaskOrFail(taskId: string) {
        const task = await TaskModel.findById(taskId);

        if (!task) {
            throw new AppError({
                httpCode: HttpCode.NOT_FOUND,
                description: 'Task not found'
            });
        }

        return task;
    }

    private async isProjectMember(projectId: string, userId: string) {
        const group = await ProjectGroupModel.exists({
            project: projectId,
            'members.user': userId
        });

        return Boolean(group);
    }

    private async isProjectManager(projectId: string, userId: string) {
        const group = await ProjectGroupModel.exists({
            project: projectId,
            members: {
                $elemMatch: {
                    user: userId,
                    role: ProjectGroupMemberRole.MANAGER
                }
            }
        });

        return Boolean(group);
    }

    private async canAccessProject(req: Request, projectId: string) {
        if (!req.user) {
            return false;
        }

        const project = await this.getProjectOrFail(projectId);

        if (req.user.role === UserRole.ADMINISTRATOR) {
            return true;
        }

        if (project.createdBy.toString() === req.user.userId) {
            return true;
        }

        return this.isProjectMember(projectId, req.user.userId);
    }

    private async canManageProjectTasks(req: Request, projectId: string) {
        if (!req.user) {
            return false;
        }

        const project = await this.getProjectOrFail(projectId);

        if (req.user.role === UserRole.ADMINISTRATOR) {
            return true;
        }

        if (project.createdBy.toString() === req.user.userId) {
            return true;
        }

        return this.isProjectManager(projectId, req.user.userId);
    }

    private async notifyAssignedUser(
        taskId: string,
        projectId: string,
        assignedTo: string | null,
        senderId: string,
        title: string
    ) {
        if (!assignedTo || assignedTo === senderId) {
            return;
        }

        await createNotification({
            recipientId: assignedTo,
            senderId,
            projectId,
            taskId,
            type: NotificationType.TASK_ASSIGNED,
            title: 'Task assigned',
            message: `You were assigned to task "${title}".`
        });
    }

    private async notifyTaskStatusChanged(
        taskId: string,
        projectId: string,
        assignedTo: string | null,
        senderId: string,
        title: string,
        status: TaskStatus
    ) {
        if (!assignedTo || assignedTo === senderId) {
            return;
        }

        await createNotification({
            recipientId: assignedTo,
            senderId,
            projectId,
            taskId,
            type: NotificationType.TASK_STATUS_CHANGED,
            title: 'Task status changed',
            message: `Task "${title}" status was changed to ${status}.`
        });
    }

    private buildTaskUpdateData(body: {
        title?: string;
        description?: string;
        assignedTo?: string | null;
        priority?: string;
        status?: string;
        dueDate?: string;
    }) {
        return {
            ...body,
            ...(Object.prototype.hasOwnProperty.call(body, 'assignedTo')
                ? { assignedTo: body.assignedTo || null }
                : {}),
            ...(body.dueDate ? { dueDate: new Date(body.dueDate) } : {})
        };
    }

    public getProjectTasks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const projectId = this.getObjectIdParam(req, 'projectId');
            const hasAccess = await this.canAccessProject(req, projectId);

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const tasks = await TaskModel.find({ project: projectId })
                .populate('project', 'name status deadline createdBy')
                .populate('assignedTo', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email role')
                .sort({ createdAt: -1 });

            return res.status(HttpCode.OK).json({
                tasks
            });
        } catch (error) {
            return next(error);
        }
    };

    public getTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const taskId = this.getObjectIdParam(req, 'taskId');
            const task = await this.getTaskOrFail(taskId);
            const hasAccess = await this.canAccessProject(req, task.project.toString());

            if (!hasAccess && task.assignedTo?.toString() !== req.user?.userId) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const populatedTask = await TaskModel.findById(taskId)
                .populate('project', 'name status deadline createdBy')
                .populate('assignedTo', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email role');

            return res.status(HttpCode.OK).json({
                task: populatedTask
            });
        } catch (error) {
            return next(error);
        }
    };

    public createTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const projectId = this.getObjectIdParam(req, 'projectId');
            const canManage = await this.canManageProjectTasks(req, projectId);

            if (!canManage) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            if (req.body.assignedTo) {
                const assignedUser = await UserModel.findById(req.body.assignedTo);

                if (!assignedUser) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.NOT_FOUND,
                            description: 'Assigned user not found'
                        })
                    );
                }

                const canAssign = await this.canAssignUserToProject(projectId, req.body.assignedTo);

                if (!canAssign) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.BAD_REQUEST,
                            description: 'Assigned user must be a project participant'
                        })
                    );
                }
            }

            const task = await TaskModel.create({
                ...req.body,
                assignedTo: req.body.assignedTo || null,
                dueDate: new Date(req.body.dueDate),
                project: projectId,
                createdBy: req.user.userId
            });

            await createTaskActivity({
                taskId: task._id.toString(),
                projectId,
                userId: req.user.userId,
                action: TaskActivityAction.CREATED,
                message: 'Task created',
                changes: {
                    title: task.title,
                    status: task.status
                }
            });

            await this.notifyAssignedUser(
                task._id.toString(),
                projectId,
                task.assignedTo?.toString() || null,
                req.user.userId,
                task.title
            );

            const populatedTask = await TaskModel.findById(task._id)
                .populate('project', 'name status deadline createdBy')
                .populate('assignedTo', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email role');

            return res.status(HttpCode.CREATED).json({
                message: 'Task created successfully',
                task: populatedTask
            });
        } catch (error) {
            return next(error);
        }
    };

    public updateTask = async (req: Request, res: Response, next: NextFunction) => {
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
            const task = await this.getTaskOrFail(taskId);
            const projectId = task.project.toString();
            const canManage = await this.canManageProjectTasks(req, projectId);

            const bodyKeys = Object.keys(req.body);
            const onlyStatusChange = bodyKeys.length === 1 && bodyKeys[0] === 'status';
            const isAssignedUser = task.assignedTo?.toString() === req.user.userId;

            if (!canManage && !(onlyStatusChange && isAssignedUser)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            if (req.body.assignedTo) {
                const assignedUser = await UserModel.findById(req.body.assignedTo);

                if (!assignedUser) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.NOT_FOUND,
                            description: 'Assigned user not found'
                        })
                    );
                }

                const canAssign = await this.canAssignUserToProject(projectId, req.body.assignedTo);

                if (!canAssign) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.BAD_REQUEST,
                            description: 'Assigned user must be a project participant'
                        })
                    );
                }
            }

            const previousAssignedTo = task.assignedTo?.toString() || null;
            const previousStatus = task.status;
            const updateData = this.buildTaskUpdateData(req.body);

            const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updateData, {
                new: true,
                runValidators: true
            })
                .populate('project', 'name status deadline createdBy')
                .populate('assignedTo', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email role');

            if (!updatedTask) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'Task not found'
                    })
                );
            }

            const nextAssignedTo = this.getReferenceId(updatedTask.assignedTo);

            await createTaskActivity({
                taskId,
                projectId,
                userId: req.user.userId,
                action: TaskActivityAction.UPDATED,
                message: 'Task updated',
                changes: req.body
            });

            if (previousAssignedTo !== nextAssignedTo) {
                await this.notifyAssignedUser(
                    taskId,
                    projectId,
                    nextAssignedTo,
                    req.user.userId,
                    updatedTask.title
                );
            }

            if (previousStatus !== updatedTask.status) {
                await this.notifyTaskStatusChanged(
                    taskId,
                    projectId,
                    nextAssignedTo,
                    req.user.userId,
                    updatedTask.title,
                    updatedTask.status
                );
            }

            return res.status(HttpCode.OK).json({
                message: 'Task updated successfully',
                task: updatedTask
            });
        } catch (error) {
            return next(error);
        }
    };

    public deleteTask = async (req: Request, res: Response, next: NextFunction) => {
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
            const task = await this.getTaskOrFail(taskId);
            const canManage = await this.canManageProjectTasks(req, task.project.toString());

            if (!canManage) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            await TaskModel.findByIdAndDelete(taskId);

            await createTaskActivity({
                taskId,
                projectId: task.project.toString(),
                userId: req.user.userId,
                action: TaskActivityAction.DELETED,
                message: 'Task deleted',
                changes: {
                    title: task.title
                }
            });

            return res.status(HttpCode.OK).json({
                message: 'Task deleted successfully'
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const tasksController = new TasksController();