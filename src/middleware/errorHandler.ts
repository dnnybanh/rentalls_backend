import { Request, Response, NextFunction } from 'express';
import { logRequestError } from '../utils/loggers';
import { FirebaseError } from '../utils/errors';

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
}

const isDevelopment = (): boolean => {
  return process.env.NODE_ENV !== 'production';
};

export const errorHandler = (
  err: AppError | FirebaseError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle Firebase errors with proper status codes
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof FirebaseError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.statusCode || err.status) {
    statusCode = err.statusCode || err.status || 500;
    message = err.message || 'Internal Server Error';
  } else {
    message = err.message || 'Internal Server Error';
  }

  // Log error with full context using helper
  logRequestError(req, err, statusCode);

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: isDevelopment() ? message : 'Internal Server Error',
      ...(isDevelopment() && { stack: err.stack }),
      ...(err instanceof FirebaseError && err.code && { code: err.code }),
    },
  });
};

