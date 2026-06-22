import { z } from 'zod';
import { UserRole } from '../models/user.model.js';

export const createUserSchema = z.object({
    body: z.object({
        firstName: z.string().min(2, 'First name must be at least 2 characters'),
        lastName: z.string().min(2, 'Last name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.nativeEnum(UserRole).optional(),
        isActive: z.boolean().optional()
    })
});

export const updateUserSchema = z.object({
    body: z.object({
        firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
        lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
        email: z.string().email('Invalid email address').optional(),
        password: z.string().min(6, 'Password must be at least 6 characters').optional(),
        role: z.nativeEnum(UserRole).optional(),
        isActive: z.boolean().optional()
    })
});