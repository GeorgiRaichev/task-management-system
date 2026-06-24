import type {
    TaskPriority as TaskPriorityType,
    TaskStatus as TaskStatusType
} from '../../features/tasks/types';

export type TaskFormData = {
    title: string;
    description: string;
    assignedTo: string;
    priority: TaskPriorityType;
    status: TaskStatusType;
    dueDate: string;
};