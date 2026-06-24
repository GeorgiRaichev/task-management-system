export const ProjectStatus = {
    PLANNED: 'planned',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived'
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export type ProjectOwner = {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
};

export type Project = {
    _id: string;
    name: string;
    description: string;
    deadline: string;
    status: ProjectStatus;
    createdBy: ProjectOwner;
    createdAt: string;
    updatedAt: string;
};

export type ProjectsResponse = {
    projects: Project[];
};

export type ProjectResponse = {
    project: Project;
};

export type ProjectMutationResponse = {
    message: string;
    project: Project;
};

export type CreateProjectRequest = {
    name: string;
    description: string;
    deadline: string;
    status: ProjectStatus;
};

export type UpdateProjectRequest = {
    projectId: string;
    data: Partial<CreateProjectRequest>;
}