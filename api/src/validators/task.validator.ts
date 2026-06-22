import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../models/task.model.js';

export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(2, 'Task title must be at least 2 characters'),
        description: z.string().min(5, 'Task description must be at least 5 characters'),
        assignedTo: z.string().optional(),
        priority: z.nativeEnum(TaskPriority).optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        dueDate: z.coerce.date()
    })
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(2, 'Task title must be at least 2 characters').optional(),
        description: z.string().min(5, 'Task description must be at least 5 characters').optional(),
        assignedTo: z.string().nullable().optional(),
        priority: z.nativeEnum(TaskPriority).optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        dueDate: z.coerce.date().optional()
    })
});