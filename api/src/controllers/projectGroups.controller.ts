import { Types } from "mongoose";
import type { NextFunction, Request, Response } from "express";
import { AppError, HttpCode } from "../exceptions/AppError.js";
import { ProjectModel } from "../models/project.model.js";
import {
  ProjectGroupMemberRole,
  ProjectGroupModel,
  type IProjectGroup,
} from "../models/projectGroup.model.js";
import { UserModel, UserRole } from "../models/user.model.js";

class ProjectGroupsController {
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

  private hasAccess(req: Request, group: IProjectGroup) {
    if (req.user?.role === UserRole.ADMINISTRATOR) {
      return true;
    }

    if (group.createdBy.toString() === req.user?.userId) {
      return true;
    }

    return group.members.some(
      (member) => member.user.toString() === req.user?.userId,
    );
  }

  private canManage(req: Request, group: IProjectGroup) {
    if (req.user?.role === UserRole.ADMINISTRATOR) {
      return true;
    }

    return group.createdBy.toString() === req.user?.userId;
  }

  private async getGroupOrFail(groupId: string) {
    const group = await ProjectGroupModel.findById(groupId);

    if (!group) {
      throw new AppError({
        httpCode: HttpCode.NOT_FOUND,
        description: "Project group not found",
      });
    }

    return group;
  }

  public getProjectGroups = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const filter =
        req.user?.role === UserRole.ADMINISTRATOR
          ? {}
          : {
              $or: [
                { createdBy: req.user?.userId },
                { "members.user": req.user?.userId },
              ],
            };

      const groups = await ProjectGroupModel.find(filter)
        .populate("project", "name status deadline")
        .populate("createdBy", "firstName lastName email role")
        .populate("members.user", "firstName lastName email role")
        .sort({ createdAt: -1 });

      return res.status(HttpCode.OK).json({
        groups,
      });
    } catch (error) {
      return next(error);
    }
  };

  public getProjectGroup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const groupId = this.getObjectIdParam(req, "groupId");
      const group = await this.getGroupOrFail(groupId);

      if (!this.hasAccess(req, group)) {
        return next(
          new AppError({
            httpCode: HttpCode.FORBIDDEN,
            description: "Access denied",
          }),
        );
      }

      const populatedGroup = await ProjectGroupModel.findById(groupId)
        .populate("project", "name status deadline")
        .populate("createdBy", "firstName lastName email role")
        .populate("members.user", "firstName lastName email role");

      return res.status(HttpCode.OK).json({
        group: populatedGroup,
      });
    } catch (error) {
      return next(error);
    }
  };

  public createProjectGroup = async (
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

      const { name, projectId, members = [] } = req.body;

      if (!Types.ObjectId.isValid(projectId)) {
        return next(
          new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            description: "Invalid project id",
          }),
        );
      }

      const project = await ProjectModel.findById(projectId);

      if (!project) {
        return next(
          new AppError({
            httpCode: HttpCode.NOT_FOUND,
            description: "Project not found",
          }),
        );
      }

      if (
        req.user.role !== UserRole.ADMINISTRATOR &&
        project.createdBy.toString() !== req.user.userId
      ) {
        return next(
          new AppError({
            httpCode: HttpCode.FORBIDDEN,
            description: "Access denied",
          }),
        );
      }

      const membersMap = new Map<string, ProjectGroupMemberRole>();

      membersMap.set(req.user.userId, ProjectGroupMemberRole.MANAGER);

      for (const member of members) {
        if (!Types.ObjectId.isValid(member.userId)) {
          return next(
            new AppError({
              httpCode: HttpCode.BAD_REQUEST,
              description: "Invalid member user id",
            }),
          );
        }

        membersMap.set(
          member.userId,
          member.role || ProjectGroupMemberRole.MEMBER,
        );
      }

      const memberIds = Array.from(membersMap.keys());

      const existingUsersCount = await UserModel.countDocuments({
        _id: { $in: memberIds },
      });

      if (existingUsersCount !== memberIds.length) {
        return next(
          new AppError({
            httpCode: HttpCode.NOT_FOUND,
            description: "One or more users were not found",
          }),
        );
      }

      const group = await ProjectGroupModel.create({
        name,
        project: projectId,
        createdBy: req.user.userId,
        members: memberIds.map((userId) => ({
          user: new Types.ObjectId(userId),
          role: membersMap.get(userId),
        })),
      });

      const populatedGroup = await ProjectGroupModel.findById(group._id)
        .populate("project", "name status deadline")
        .populate("createdBy", "firstName lastName email role")
        .populate("members.user", "firstName lastName email role");

      return res.status(HttpCode.CREATED).json({
        message: "Project group created successfully",
        group: populatedGroup,
      });
    } catch (error) {
      return next(error);
    }
  };

  public updateProjectGroup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const groupId = this.getObjectIdParam(req, "groupId");
      const group = await this.getGroupOrFail(groupId);

      if (!this.canManage(req, group)) {
        return next(
          new AppError({
            httpCode: HttpCode.FORBIDDEN,
            description: "Access denied",
          }),
        );
      }

      const updatedGroup = await ProjectGroupModel.findByIdAndUpdate(
        groupId,
        req.body,
        { new: true, runValidators: true },
      )
        .populate("project", "name status deadline")
        .populate("createdBy", "firstName lastName email role")
        .populate("members.user", "firstName lastName email role");

      return res.status(HttpCode.OK).json({
        message: "Project group updated successfully",
        group: updatedGroup,
      });
    } catch (error) {
      return next(error);
    }
  };

  public deleteProjectGroup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const groupId = this.getObjectIdParam(req, "groupId");
      const group = await this.getGroupOrFail(groupId);

      if (!this.canManage(req, group)) {
        return next(
          new AppError({
            httpCode: HttpCode.FORBIDDEN,
            description: "Access denied",
          }),
        );
      }

      await ProjectGroupModel.findByIdAndDelete(groupId);

      return res.status(HttpCode.OK).json({
        message: "Project group deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  };

  public addMember = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const groupId = this.getObjectIdParam(req, "groupId");
      const group = await this.getGroupOrFail(groupId);

      if (!this.canManage(req, group)) {
        return next(
          new AppError({
            httpCode: HttpCode.FORBIDDEN,
            description: "Access denied",
          }),
        );
      }

      const { userId, role = ProjectGroupMemberRole.MEMBER } = req.body;

      if (!Types.ObjectId.isValid(userId)) {
        return next(
          new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            description: "Invalid user id",
          }),
        );
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        return next(
          new AppError({
            httpCode: HttpCode.NOT_FOUND,
            description: "User not found",
          }),
        );
      }

      const alreadyMember = group.members.some(
        (member) => member.user.toString() === userId,
      );

      if (alreadyMember) {
        return next(
          new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            description: "User is already a member of this group",
          }),
        );
      }

      group.members = [
        ...group.members,
        {
          user: new Types.ObjectId(userId),
          role,
        },
      ];

      await group.save();

      const populatedGroup = await ProjectGroupModel.findById(groupId)
        .populate("project", "name status deadline")
        .populate("createdBy", "firstName lastName email role")
        .populate("members.user", "firstName lastName email role");

      return res.status(HttpCode.OK).json({
        message: "Member added successfully",
        group: populatedGroup,
      });
    } catch (error) {
      return next(error);
    }
  };

  public removeMember = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const groupId = this.getObjectIdParam(req, "groupId");
      const userId = this.getObjectIdParam(req, "userId");

      const group = await this.getGroupOrFail(groupId);

      if (!this.canManage(req, group)) {
        return next(
          new AppError({
            httpCode: HttpCode.FORBIDDEN,
            description: "Access denied",
          }),
        );
      }

      if (group.createdBy.toString() === userId) {
        return next(
          new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            description: "Group creator cannot be removed",
          }),
        );
      }

      group.members = group.members.filter(
        (member) => member.user.toString() !== userId,
      );

      await group.save();

      const populatedGroup = await ProjectGroupModel.findById(groupId)
        .populate("project", "name status deadline")
        .populate("createdBy", "firstName lastName email role")
        .populate("members.user", "firstName lastName email role");

      return res.status(HttpCode.OK).json({
        message: "Member removed successfully",
        group: populatedGroup,
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const projectGroupsController = new ProjectGroupsController();
