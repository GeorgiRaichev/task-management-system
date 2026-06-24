import { UserRole, type User } from '../features/auth/types';
import { ProjectGroupMemberRole, type ProjectGroup } from '../features/groups/types';
import type { Project } from '../features/projects/types';

export const isAdmin = (user: User | null) => {
    return user?.role === UserRole.ADMINISTRATOR;
};

export const isProjectCreator = (project: Project, user: User | null) => {
    return project.createdBy?._id === user?._id;
};

export const canCreateProject = (user: User | null) => {
    return Boolean(user);
};

export const canManageProject = (project: Project, user: User | null) => {
    return isAdmin(user) || isProjectCreator(project, user);
};

export const canEditProject = (project: Project, user: User | null) => {
    return canManageProject(project, user);
};

export const canDeleteProject = (project: Project, user: User | null) => {
    return canManageProject(project, user);
};

export const isGroupCreator = (group: ProjectGroup, user: User | null) => {
    return group.createdBy?._id === user?._id;
};

export const isGroupManager = (group: ProjectGroup, user: User | null) => {
    return group.members.some(
        (member) =>
            member.user._id === user?._id && member.role === ProjectGroupMemberRole.MANAGER
    );
};

export const isGroupMember = (group: ProjectGroup, user: User | null) => {
    return group.members.some((member) => member.user._id === user?._id);
};

export const canManageGroup = (group: ProjectGroup, user: User | null) => {
    return isAdmin(user) || isGroupCreator(group, user) || isGroupManager(group, user);
};

export const canEditGroup = (group: ProjectGroup, user: User | null) => {
    return canManageGroup(group, user);
};

export const canDeleteGroup = (group: ProjectGroup, user: User | null) => {
    return canManageGroup(group, user);
};

export const canManageGroupMembers = (group: ProjectGroup, user: User | null) => {
    return canManageGroup(group, user);
};

export const canCreateGroupForProject = (project: Project, user: User | null) => {
    return isAdmin(user) || isProjectCreator(project, user);
};

export const canCreateUser = (user: User | null) => {
    return isAdmin(user);
};

export const canEditUser = (user: User | null) => {
    return isAdmin(user);
};

export const canDeleteUser = (currentUser: User | null, targetUser: User) => {
    return isAdmin(currentUser) && currentUser?._id !== targetUser._id;
};

export const canCreateAdministrator = (user: User | null) => {
    return isAdmin(user);
};