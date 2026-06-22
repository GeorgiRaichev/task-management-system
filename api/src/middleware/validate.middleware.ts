import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { AppError, HttpCode } from '../exceptions/AppError.js';

type ParsedRequestData = {
    body?: unknown;
    params?: unknown;
    query?: unknown;
};

export const validate = <T extends z.ZodTypeAny>(schema: T) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query
        });

        if (!result.success) {
            const message = result.error.issues
                .map((issue) => issue.message)
                .join(', ');

            return next(new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: message
            }));
        }

        const parsedData = result.data as ParsedRequestData;

        if (parsedData.body) {
            req.body = parsedData.body;
        }

        return next();
    };
};