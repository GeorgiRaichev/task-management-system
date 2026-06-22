import { z } from 'zod';

export const createCommentSchema = z.object({
    body: z.object({
        content: z.string().min(2, 'Comment must be at least 2 characters')
    })
});

export const updateCommentSchema = z.object({
    body: z.object({
        content: z.string().min(2, 'Comment must be at least 2 characters')
    })
});