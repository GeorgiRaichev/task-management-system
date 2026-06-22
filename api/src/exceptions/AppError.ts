export enum HttpCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

type AppErrorArgs = {
  httpCode: HttpCode;
  description: string;
  isOperational?: boolean;
};

export class AppError extends Error {
  public readonly httpCode: HttpCode;
  public readonly isOperational: boolean;

  constructor(args: AppErrorArgs) {
    super(args.description);

    this.httpCode = args.httpCode;
    this.isOperational = args.isOperational ?? true;

    Error.captureStackTrace(this, AppError);
  }
}