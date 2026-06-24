import type { User } from '../auth/types';

export const ProjectGroupMemberRole = {
    MEMBER: 'member',
    MANAGER: 'manager'
} as const;

export type ProjectGroupMemberRole =
    (typeof ProjectGroupMemberRole)[keyof typeof ProjectGroupMemberRole];

export type GroupProject = {
    _id: string;
    name: string;
    status: string;
    deadline: string;
};

export type ProjectGroupMember = {
    user: User;
    role: ProjectGroupMemberRole;
};

export type ProjectGroup = {
    _id: string;
    name: string;
    project: GroupProject;
    createdBy: User;
    members: ProjectGroupMember[];
    createdAt: string;
    updatedAt: string;
};

export type GroupsResponse = {
    groups: ProjectGroup[];
};

export type GroupResponse = {
    group: ProjectGroup;
};

export type CreateGroupRequest = {
    name: string;
    projectId: string;
    members: {
        userId: string;
        role: ProjectGroupMemberRole;
    }[];
};

export type UpdateGroupRequest = {
    groupId: string;
    data: {
        name?: string;
    };
};

export type AddMemberRequest = {
    groupId: string;
    userId: string;
    role: ProjectGroupMemberRole;
};

export type UpdateMemberRoleRequest = {
    groupId: string;
    userId: string;
    role: ProjectGroupMemberRole;
};

export type RemoveMemberRequest = {
    groupId: string;
    userId: string;
};