import type { ChipProps } from '@mui/material';
import { TaskPriority, type Task, type TaskPriority as TaskPriorityType } from '../../features/tasks/types';
import type { TaskFormData } from './project-board.types';

export const getPriorityColor = (priority: TaskPriorityType): ChipProps['color'] => {
    if (priority === TaskPriority.HIGH) {
        return 'error';
    }

    if (priority === TaskPriority.MEDIUM) {
        return 'warning';
    }

    return 'success';
};

export const taskToForm = (task: Task): TaskFormData => ({
    title: task.title,
    description: task.description,
    assignedTo: task.assignedTo?._id || '',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
});

export const getUserDisplayName = (
    targetUser:
        | {
              _id: string;
              firstName: string;
              lastName: string;
          }
        | null
        | undefined,
    currentUserId: string | undefined,
    meLabel: string
) => {
    if (!targetUser) {
        return 'N/A';
    }

    if (targetUser._id === currentUserId) {
        return meLabel;
    }

    return `${targetUser.firstName} ${targetUser.lastName}`;
};