import type { Request, Response, NextFunction, CookieOptions } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError, HttpCode } from "../exceptions/AppError.js";
import { UserModel, UserRole } from "../models/user.model.js";

class AuthController {
  private createToken(userId: string, role: UserRole) {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: "JWT secret is missing",
      });
    }

    const options: SignOptions = {
      expiresIn:
        (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "7d",
    };

    return jwt.sign({ userId, role }, jwtSecret, options);
  }

  private getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      const existingUser = await UserModel.findOne({ email });

      if (existingUser) {
        return next(
          new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            description: "User with this email already exists",
          }),
        );
      }

      const usersCount = await UserModel.countDocuments();
      const role =
        usersCount === 0 ? UserRole.ADMINISTRATOR : UserRole.REGISTERED_USER;

      const user = await UserModel.create({
        firstName,
        lastName,
        email,
        password,
        role,
      });

      const accessToken = this.createToken(user._id.toString(), user.role);

      res.cookie("accessToken", accessToken, this.getCookieOptions());

      return res.status(HttpCode.CREATED).json({
        message: "User registered successfully",
        accessToken,
        user,
      });
    } catch (error) {
      return next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findOne({ email }).select("+password");

      if (!user) {
        return next(
          new AppError({
            httpCode: HttpCode.NOT_FOUND,
            description: "User not found",
          }),
        );
      }

      if (!user.isActive) {
        return next(
          new AppError({
            httpCode: HttpCode.FORBIDDEN,
            description: "User account is inactive",
          }),
        );
      }

      const passwordMatches = await user.comparePassword(password);

      if (!passwordMatches) {
        return next(
          new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            description: "Invalid credentials",
          }),
        );
      }

      const accessToken = this.createToken(user._id.toString(), user.role);

      res.cookie("accessToken", accessToken, this.getCookieOptions());

      return res.status(HttpCode.OK).json({
        message: "User logged in successfully",
        accessToken,
        user,
      });
    } catch (error) {
      return next(error);
    }
  };

  public logout = async (_req: Request, res: Response) => {
    res.clearCookie("accessToken", this.getCookieOptions());

    return res.status(HttpCode.OK).json({
      message: "User logged out successfully",
    });
  };

  public me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(
          new AppError({
            httpCode: HttpCode.UNAUTHORIZED,
            description: "Unauthorized",
          }),
        );
      }

      const user = await UserModel.findById(req.user.userId);

      if (!user) {
        return next(
          new AppError({
            httpCode: HttpCode.NOT_FOUND,
            description: "User not found",
          }),
        );
      }

      return res.status(HttpCode.OK).json({
        user,
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const authController = new AuthController();