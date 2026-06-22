import type { NextFunction, Request, Response } from "express";
import { AppError, HttpCode } from "../exceptions/AppError.js";

export const errorMiddleware = (
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    return res.status(error.httpCode).json({
      message: error.message,
    });
  }

  return res.status(HttpCode.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error",
  });
};