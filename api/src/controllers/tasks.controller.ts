import { Types } from "mongoose";
import type { NextFunction, Request, Response } from "express";
import { AppError, HttpCode } from "../exceptions/AppError.js";
import { ProjectModel } from "../models/project.model.js";
import {
    ProjectGroupMemberRole,
    ProjectGroupModel,
} from "../models/projectGroup.model.js";
import { TaskModel } from "../models/task.model.js";
import { UserModel, UserRole } from "../models/user.model.js";

class TasksController {
    private getObjectIdParam(req: Request, paramName: string) {
        const value = req.params[paramName];

        if (!value || Array.isArray(value) || !Types.ObjectId.isValid(value)) {
            throw new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: `Invalid ${paramName}`,
            });
        }

        return value;
    }

    private async canAccessProject(
        req: Request,
        projectId: string,
        createdBy: string,
    ) {
        if (req.user?.role === UserRole.ADMINISTRATOR) {
            return true;
        }

        if (createdBy === req.user?.userId) {
            return true;
        }

        const group = await ProjectGroupModel.exists({
            project: projectId,
            "members.user": req.user?.userId,
        });

        return Boolean(group);
    }

    private async canManageProject(
        req: Request,
        projectId: string,
        createdBy: string,
    ) {
        if (req.user?.role === UserRole.ADMINISTRATOR) {
            return true;
        }

        if (createdBy === req.user?.userId) {
            return true;
        }

        const group = await ProjectGroupModel.exists({
            project: projectId,
            members: {
                $elemMatch: {
                    user: req.user?.userId,
                    role: ProjectGroupMemberRole.MANAGER,
                },
            },
        });

        return Boolean(group);
    }

    private async getProjectOrFail(projectId: string) {
        const project = await ProjectModel.findById(projectId);

        if (!project) {
            throw new AppError({
                httpCode: HttpCode.NOT_FOUND,
                description: "Project not found",
            });
        }

        return project;
    }

    private async getTaskOrFail(taskId: string) {
        const task = await TaskModel.findById(taskId);

        if (!task) {
            throw new AppError({
                httpCode: HttpCode.NOT_FOUND,
                description: "Task not found",
            });
        }

        return task;
    }

    public getProjectTasks = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const projectId = this.getObjectIdParam(req, "projectId");
            const project = await this.getProjectOrFail(projectId);

            const hasAccess = await this.canAccessProject(
                req,
                projectId,
                project.createdBy.toString(),
            );

            if (!hasAccess) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: "Access denied",
                    }),
                );
            }

            const tasks = await TaskModel.find({ project: projectId })
                .populate("project", "name status deadline")
                .populate("assignedTo", "firstName lastName email role")
                .populate("createdBy", "firstName lastName email role")
                .sort({ createdAt: -1 });

            return res.status(HttpCode.OK).json({
                tasks,
            });
        } catch (error) {
            return next(error);
        }
    };

    public getTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const taskId = this.getObjectIdParam(req, "taskId");
            const task = await this.getTaskOrFail(taskId);
            const project = await this.getProjectOrFail(task.project.toString());

            const hasAccess = await this.canAccessProject(
                req,
                project._id.toString(),
                project.createdBy.toString(),
            );

            const isAssignedUser = task.assignedTo?.toString() === req.user?.userId;

            if (!hasAccess && !isAssignedUser) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: "Access denied",
                    }),
                );
            }

            const populatedTask = await TaskModel.findById(taskId)
                .populate("project", "name status deadline")
                .populate("assignedTo", "firstName lastName email role")
                .populate("createdBy", "firstName lastName email role");

            return res.status(HttpCode.OK).json({
                task: populatedTask,
            });
        } catch (error) {
            return next(error);
        }
    };

    public createTask = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: "Unauthorized",
                    }),
                );
            }

            const projectId = this.getObjectIdParam(req, "projectId");
            const project = await this.getProjectOrFail(projectId);

            const canManage = await this.canManageProject(
                req,
                projectId,
                project.createdBy.toString(),
            );

            if (!canManage) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: "Access denied",
                    }),
                );
            }

            const { assignedTo } = req.body;

            if (assignedTo) {
                if (!Types.ObjectId.isValid(assignedTo)) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.BAD_REQUEST,
                            description: "Invalid assigned user id",
                        }),
                    );
                }

                const assignedUser = await UserModel.findById(assignedTo);

                if (!assignedUser) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.NOT_FOUND,
                            description: "Assigned user not found",
                        }),
                    );
                }
            }

            const task = await TaskModel.create({
                ...req.body,
                project: projectId,
                createdBy: req.user.userId,
            });

            const populatedTask = await TaskModel.findById(task._id)
                .populate("project", "name status deadline")
                .populate("assignedTo", "firstName lastName email role")
                .populate("createdBy", "firstName lastName email role");

            return res.status(HttpCode.CREATED).json({
                message: "Task created successfully",
                task: populatedTask,
            });
        } catch (error) {
            return next(error);
        }
    };

    public updateTask = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const taskId = this.getObjectIdParam(req, "taskId");
            const task = await this.getTaskOrFail(taskId);
            const project = await this.getProjectOrFail(task.project.toString());

            const canManage = await this.canManageProject(
                req,
                project._id.toString(),
                project.createdBy.toString(),
            );

            const isAssignedUser = task.assignedTo?.toString() === req.user?.userId;

            if (!canManage && !isAssignedUser) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: "Access denied",
                    }),
                );
            }

            const { assignedTo } = req.body;

            if (assignedTo) {
                if (!Types.ObjectId.isValid(assignedTo)) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.BAD_REQUEST,
                            description: "Invalid assigned user id",
                        }),
                    );
                }

                const assignedUser = await UserModel.findById(assignedTo);

                if (!assignedUser) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.NOT_FOUND,
                            description: "Assigned user not found",
                        }),
                    );
                }
            }

            const updatedTask = await TaskModel.findByIdAndUpdate(taskId, req.body, {
                new: true,
                runValidators: true,
            })
                .populate("project", "name status deadline")
                .populate("assignedTo", "firstName lastName email role")
                .populate("createdBy", "firstName lastName email role");

            return res.status(HttpCode.OK).json({
                message: "Task updated successfully",
                task: updatedTask,
            });
        } catch (error) {
            return next(error);
        }
    };

    public deleteTask = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const taskId = this.getObjectIdParam(req, "taskId");
            const task = await this.getTaskOrFail(taskId);
            const project = await this.getProjectOrFail(task.project.toString());

            const canManage = await this.canManageProject(
                req,
                project._id.toString(),
                project.createdBy.toString(),
            );

            if (!canManage) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: "Access denied",
                    }),
                );
            }

            await TaskModel.findByIdAndDelete(taskId);

            return res.status(HttpCode.OK).json({
                message: "Task deleted successfully",
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const tasksController = new TasksController();