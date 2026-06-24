import { TaskPriority, TaskStatus, type TaskPriority as TaskPriorityType, type TaskStatus as TaskStatusType } from '../../features/tasks/types';
import type { TranslationKey } from '../../i18n/translations';
import type { TaskFormData } from './project-board.types';

export const columns: { status: TaskStatusType; label: TranslationKey }[] = [
    { status: TaskStatus.TODO, label: 'todo' },
    { status: TaskStatus.IN_PROGRESS, label: 'inProgress' },
    { status: TaskStatus.REVIEW, label: 'review' },
    { status: TaskStatus.DONE, label: 'done' }
];

export const priorityLabels: Record<TaskPriorityType, TranslationKey> = {
    [TaskPriority.LOW]: 'low',
    [TaskPriority.MEDIUM]: 'medium',
    [TaskPriority.HIGH]: 'high'
};

export const initialTaskForm: TaskFormData = {
    title: '',
    description: '',
    assignedTo: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    dueDate: ''
};