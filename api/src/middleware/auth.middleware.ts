import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError, HttpCode } from "../exceptions/AppError.js";

type TokenPayload = {
  userId: string;
  role: "registered_user" | "project_manager" | "administrator";
};

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token =
    req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(
      new AppError({
        httpCode: HttpCode.UNAUTHORIZED,
        description: "No token provided",
      }),
    );
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return next(
      new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: "JWT secret is missing",
      }),
    );
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch {
    return next(
      new AppError({
        httpCode: HttpCode.UNAUTHORIZED,
        description: "Invalid token",
      }),
    );
  }
};