import type { User } from '../auth/types';
import type { Project } from '../projects/types';

export const TaskStatus = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done'
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export type Task = {
    _id: string;
    title: string;
    description: string;
    project: Project;
    assignedTo?: User | null;
    createdBy: User;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
    createdAt: string;
    updatedAt: string;
};

export type TasksResponse = {
    tasks: Task[];
};

export type TaskResponse = {
    task: Task;
};

export type CreateTaskRequest = {
    projectId: string;
    title: string;
    description: string;
    assignedTo?: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
};

export type UpdateTaskRequest = {
    taskId: string;
    data: Partial<Omit<CreateTaskRequest, 'projectId'>>;
};

export type TaskCommentAuthor = {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
};

export type TaskComment = {
    _id: string;
    content: string;
    author: TaskCommentAuthor;
    createdAt: string;
    updatedAt: string;
};

export type TaskCommentsResponse = {
    comments: TaskComment[];
};

export type CreateTaskCommentRequest = {
    taskId: string;
    content: string;
};

export type UpdateTaskCommentRequest = {
    commentId: string;
    content: string;
};

export type DeleteTaskCommentRequest = {
    commentId: string;
};

export type TaskCommentResponse = {
    message: string;
    comment: TaskComment;
};