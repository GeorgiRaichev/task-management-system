import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../models/task.model.js';

export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().trim().min(2).max(150),
        description: z.string().trim().min(5).max(1500),
        assignedTo: z.string().optional().nullable(),
        priority: z.enum(Object.values(TaskPriority) as [TaskPriority, ...TaskPriority[]]).optional(),
        status: z.enum(Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]]).optional(),
        dueDate: z.string().min(1)
    }),
    params: z.object({
        projectId: z.string().min(1)
    }),
    query: z.object({}).optional()
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().trim().min(2).max(150).optional(),
        description: z.string().trim().min(5).max(1500).optional(),
        assignedTo: z.string().optional().nullable(),
        priority: z.enum(Object.values(TaskPriority) as [TaskPriority, ...TaskPriority[]]).optional(),
        status: z.enum(Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]]).optional(),
        dueDate: z.string().min(1).optional()
    }),
    params: z.object({
        taskId: z.string().min(1)
    }),
    query: z.object({}).optional()
});