import { z } from 'zod';
import { TaskActivityAction } from '../models/taskActivity.model.js';

export const createTaskActivitySchema = z.object({
    body: z.object({
        action: z.nativeEnum(TaskActivityAction),
        message: z.string().min(2, 'Activity message must be at least 2 characters'),
        changes: z.record(z.string(), z.unknown()).optional()
    })
});