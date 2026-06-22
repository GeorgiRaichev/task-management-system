import { z } from 'zod';
import { NotificationType } from '../models/notification.model.js';

export const createNotificationSchema = z.object({
    body: z.object({
        recipientId: z.string().min(1, 'Recipient id is required'),
        projectId: z.string().optional(),
        taskId: z.string().optional(),
        type: z.nativeEnum(NotificationType).optional(),
        title: z.string().min(2, 'Title must be at least 2 characters'),
        message: z.string().min(2, 'Message must be at least 2 characters')
    })
});