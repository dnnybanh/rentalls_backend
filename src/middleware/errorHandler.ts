import { Request, Response, NextFunction } from 'express';
import { logRequestError } from '../utils/loggers';

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
}

const isDevelopment = (): boolean => {
  return process.env.NODE_ENV !== 'production';
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log error with full context using helper
  logRequestError(req, err, statusCode);

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: isDevelopment() ? message : 'Internal Server Error',
      ...(isDevelopment() && { stack: err.stack }),
    },
  });
};

