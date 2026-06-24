import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { AppError, HttpCode } from '../exceptions/AppError.js';
import { NotificationType } from '../models/notification.model.js';
import { ProjectModel } from '../models/project.model.js';
import {
    ProjectGroupMemberRole,
    ProjectGroupModel,
    type IProjectGroup
} from '../models/projectGroup.model.js';
import { UserModel, UserRole } from '../models/user.model.js';
import { createNotification } from '../services/notification.service.js';
import { escapeRegex } from '../utils/escape-regex.js';

class ProjectGroupsController {
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

    private normalizeName(name: string) {
        return name.trim().replace(/\s+/g, ' ');
    }

    private async ensureUniqueGroupName(name: string, groupId?: string) {
        if (!name || typeof name !== 'string') {
            throw new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: 'Group name is required'
            });
        }

        const normalizedName = this.normalizeName(name);

        const existingGroup = await ProjectGroupModel.findOne({
            name: {
                $regex: `^${escapeRegex(normalizedName)}$`,
                $options: 'i'
            },
            ...(groupId ? { _id: { $ne: groupId } } : {})
        });

        if (existingGroup) {
            throw new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: 'Group name already exists'
            });
        }

        return normalizedName;
    }

    private hasAccess(req: Request, group: IProjectGroup) {
        if (req.user?.role === UserRole.ADMINISTRATOR) {
            return true;
        }

        if (group.createdBy.toString() === req.user?.userId) {
            return true;
        }

        return group.members.some((member) => member.user.toString() === req.user?.userId);
    }

    private canManage(req: Request, group: IProjectGroup) {
        if (req.user?.role === UserRole.ADMINISTRATOR) {
            return true;
        }

        if (group.createdBy.toString() === req.user?.userId) {
            return true;
        }

        return group.members.some(
            (member) =>
                member.user.toString() === req.user?.userId &&
                member.role === ProjectGroupMemberRole.MANAGER
        );
    }

    private async getGroupOrFail(groupId: string) {
        const group = await ProjectGroupModel.findById(groupId);

        if (!group) {
            throw new AppError({
                httpCode: HttpCode.NOT_FOUND,
                description: 'Project group not found'
            });
        }

        return group;
    }

    private async notifyAddedMember(
        recipientId: string,
        senderId: string,
        projectId: string,
        projectName: string,
        role: ProjectGroupMemberRole
    ) {
        if (recipientId === senderId) {
            return;
        }

        await createNotification({
            recipientId,
            senderId,
            projectId,
            type: NotificationType.GENERAL,
            title: role === ProjectGroupMemberRole.MANAGER ? 'Added as manager' : 'Added as member',
            message:
                role === ProjectGroupMemberRole.MANAGER
                    ? `You were added as Manager to project "${projectName}".`
                    : `You were added as Member to project "${projectName}".`
        });
    }

    private async notifyRemovedMember(
        recipientId: string,
        senderId: string,
        projectId: string,
        projectName: string
    ) {
        if (recipientId === senderId) {
            return;
        }

        await createNotification({
            recipientId,
            senderId,
            projectId,
            type: NotificationType.GENERAL,
            title: 'Removed from project',
            message: `You were removed from project "${projectName}".`
        });
    }

    private async notifyMemberRoleChanged(
        recipientId: string,
        senderId: string,
        projectId: string,
        projectName: string,
        role: ProjectGroupMemberRole
    ) {
        if (recipientId === senderId) {
            return;
        }

        await createNotification({
            recipientId,
            senderId,
            projectId,
            type: NotificationType.GENERAL,
            title: role === ProjectGroupMemberRole.MANAGER ? 'You became manager' : 'You became member',
            message:
                role === ProjectGroupMemberRole.MANAGER
                    ? `Your role in project "${projectName}" was changed to Manager.`
                    : `Your role in project "${projectName}" was changed to Member.`
        });
    }

    public getProjectGroups = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const filter =
                req.user.role === UserRole.ADMINISTRATOR
                    ? {}
                    : {
                        $or: [
                            { createdBy: req.user.userId },
                            { 'members.user': req.user.userId }
                        ]
                    };

            const groups = await ProjectGroupModel.find(filter)
                .populate('project', 'name status deadline')
                .populate('createdBy', 'firstName lastName email role')
                .populate('members.user', 'firstName lastName email role')
                .sort({ createdAt: -1 });

            return res.status(HttpCode.OK).json({
                groups
            });
        } catch (error) {
            return next(error);
        }
    };

    public getProjectGroup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const groupId = this.getObjectIdParam(req, 'groupId');
            const group = await this.getGroupOrFail(groupId);

            if (!this.hasAccess(req, group)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const populatedGroup = await ProjectGroupModel.findById(groupId)
                .populate('project', 'name status deadline')
                .populate('createdBy', 'firstName lastName email role')
                .populate('members.user', 'firstName lastName email role');

            return res.status(HttpCode.OK).json({
                group: populatedGroup
            });
        } catch (error) {
            return next(error);
        }
    };

    public createProjectGroup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const { name, projectId, members = [] } = req.body;

            const normalizedName = await this.ensureUniqueGroupName(name);

            if (!Types.ObjectId.isValid(projectId)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Invalid project id'
                    })
                );
            }

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

            const membersMap = new Map<string, ProjectGroupMemberRole>();
            const senderId = req.user.userId;

            membersMap.set(senderId, ProjectGroupMemberRole.MANAGER);

            for (const member of members) {
                if (!Types.ObjectId.isValid(member.userId)) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.BAD_REQUEST,
                            description: 'Invalid member user id'
                        })
                    );
                }

                const memberRole = member.role || ProjectGroupMemberRole.MEMBER;

                if (!Object.values(ProjectGroupMemberRole).includes(memberRole)) {
                    return next(
                        new AppError({
                            httpCode: HttpCode.BAD_REQUEST,
                            description: 'Invalid member role'
                        })
                    );
                }

                membersMap.set(member.userId, memberRole);
            }

            const memberIds = Array.from(membersMap.keys());

            const existingUsersCount = await UserModel.countDocuments({
                _id: { $in: memberIds }
            });

            if (existingUsersCount !== memberIds.length) {
                return next(
                    new AppError({
                        httpCode: HttpCode.NOT_FOUND,
                        description: 'One or more users were not found'
                    })
                );
            }
            const existingProjectGroup = await ProjectGroupModel.findOne({
                project: projectId
            });

            if (existingProjectGroup) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'This project already has a group'
                    })
                );
            }
            const group = await ProjectGroupModel.create({
                name: normalizedName,
                project: projectId,
                createdBy: senderId,
                members: memberIds.map((userId) => ({
                    user: new Types.ObjectId(userId),
                    role: membersMap.get(userId)
                }))
            });

            const populatedGroup = await ProjectGroupModel.findById(group._id)
                .populate('project', 'name status deadline')
                .populate('createdBy', 'firstName lastName email role')
                .populate('members.user', 'firstName lastName email role');

            await Promise.all(
                memberIds.map((userId) =>
                    this.notifyAddedMember(
                        userId,
                        senderId,
                        projectId,
                        project.name,
                        membersMap.get(userId) || ProjectGroupMemberRole.MEMBER
                    )
                )
            );

            return res.status(HttpCode.CREATED).json({
                message: 'Project group created successfully',
                group: populatedGroup
            });
        } catch (error) {
            return next(error);
        }
    };

    public updateProjectGroup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const groupId = this.getObjectIdParam(req, 'groupId');
            const group = await this.getGroupOrFail(groupId);

            if (!this.canManage(req, group)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const updateData = { ...req.body };

            if (updateData.name) {
                updateData.name = await this.ensureUniqueGroupName(updateData.name, groupId);
            }

            const updatedGroup = await ProjectGroupModel.findByIdAndUpdate(groupId, updateData, {
                new: true,
                runValidators: true
            })
                .populate('project', 'name status deadline')
                .populate('createdBy', 'firstName lastName email role')
                .populate('members.user', 'firstName lastName email role');

            return res.status(HttpCode.OK).json({
                message: 'Project group updated successfully',
                group: updatedGroup
            });
        } catch (error) {
            return next(error);
        }
    };

    public deleteProjectGroup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const groupId = this.getObjectIdParam(req, 'groupId');
            const group = await this.getGroupOrFail(groupId);

            if (!this.canManage(req, group)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            await ProjectGroupModel.findByIdAndDelete(groupId);

            return res.status(HttpCode.OK).json({
                message: 'Project group deleted successfully'
            });
        } catch (error) {
            return next(error);
        }
    };

    public addMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const groupId = this.getObjectIdParam(req, 'groupId');
            const group = await this.getGroupOrFail(groupId);

            if (!this.canManage(req, group)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            const { userId, role = ProjectGroupMemberRole.MEMBER } = req.body;

            if (!Types.ObjectId.isValid(userId)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Invalid user id'
                    })
                );
            }

            if (!Object.values(ProjectGroupMemberRole).includes(role)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Invalid member role'
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

            const alreadyMember = group.members.some((member) => member.user.toString() === userId);

            if (alreadyMember) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'User is already a member of this group'
                    })
                );
            }

            group.members = [
                ...group.members,
                {
                    user: new Types.ObjectId(userId),
                    role
                }
            ];

            await group.save();

            const populatedGroup = await ProjectGroupModel.findById(groupId)
                .populate('project', 'name status deadline')
                .populate('createdBy', 'firstName lastName email role')
                .populate('members.user', 'firstName lastName email role');

            const project = await ProjectModel.findById(group.project).select('name');

            await this.notifyAddedMember(
                userId,
                req.user.userId,
                group.project.toString(),
                project?.name || 'N/A',
                role
            );

            return res.status(HttpCode.OK).json({
                message: 'Member added successfully',
                group: populatedGroup
            });
        } catch (error) {
            return next(error);
        }
    };

    public updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const groupId = this.getObjectIdParam(req, 'groupId');
            const userId = this.getObjectIdParam(req, 'userId');
            const { role } = req.body;

            if (!Object.values(ProjectGroupMemberRole).includes(role)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Invalid member role'
                    })
                );
            }

            const group = await this.getGroupOrFail(groupId);

            if (!this.canManage(req, group)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            if (group.createdBy.toString() === userId) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Group creator role cannot be changed'
                    })
                );
            }

            const member = group.members.find((item) => item.user.toString() === userId);

            if (!member) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'User is not a member of this group'
                    })
                );
            }

            const previousRole = member.role;

            member.role = role;

            await group.save();

            const populatedGroup = await ProjectGroupModel.findById(groupId)
                .populate('project', 'name status deadline')
                .populate('createdBy', 'firstName lastName email role')
                .populate('members.user', 'firstName lastName email role');

            const project = await ProjectModel.findById(group.project).select('name');

            if (previousRole !== role) {
                await this.notifyMemberRoleChanged(
                    userId,
                    req.user.userId,
                    group.project.toString(),
                    project?.name || 'N/A',
                    role
                );
            }

            return res.status(HttpCode.OK).json({
                message: 'Member role updated successfully',
                group: populatedGroup
            });
        } catch (error) {
            return next(error);
        }
    };

    public removeMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(
                    new AppError({
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: 'Unauthorized'
                    })
                );
            }

            const groupId = this.getObjectIdParam(req, 'groupId');
            const userId = this.getObjectIdParam(req, 'userId');

            const group = await this.getGroupOrFail(groupId);

            if (!this.canManage(req, group)) {
                return next(
                    new AppError({
                        httpCode: HttpCode.FORBIDDEN,
                        description: 'Access denied'
                    })
                );
            }

            if (group.createdBy.toString() === userId) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'Group creator cannot be removed'
                    })
                );
            }

            const wasMember = group.members.some((member) => member.user.toString() === userId);

            if (!wasMember) {
                return next(
                    new AppError({
                        httpCode: HttpCode.BAD_REQUEST,
                        description: 'User is not a member of this group'
                    })
                );
            }

            group.members = group.members.filter((member) => member.user.toString() !== userId);

            await group.save();

            const populatedGroup = await ProjectGroupModel.findById(groupId)
                .populate('project', 'name status deadline')
                .populate('createdBy', 'firstName lastName email role')
                .populate('members.user', 'firstName lastName email role');

            const project = await ProjectModel.findById(group.project).select('name');

            await this.notifyRemovedMember(
                userId,
                req.user.userId,
                group.project.toString(),
                project?.name || 'N/A'
            );

            return res.status(HttpCode.OK).json({
                message: 'Member removed successfully',
                group: populatedGroup
            });
        } catch (error) {
            return next(error);
        }
    };
}

export const projectGroupsController = new ProjectGroupsController();