import logger from '../logger';
import { BaseLogContext, LogLevel } from './types';

export interface AuthContext {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export const logAuthEvent = (
  event: string,
  level: LogLevel,
  context: AuthContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'auth',
    event,
    ...context,
  };

  logger[level](logData, `Auth event: ${event}`);
};

export const logRegistration = (
  event: 'attempt' | 'success' | 'failure',
  context: AuthContext & { fullName?: string; error?: Error | string }
) => {
  const level: LogLevel = event === 'failure' ? 'error' : 'info';
  const logData: BaseLogContext = {
    type: 'auth',
    event: `registration_${event}`,
    ...context,
    ...(context.error && {
      error: context.error instanceof Error ? {
        message: context.error.message,
        stack: context.error.stack,
        name: context.error.name,
      } : { message: context.error },
    }),
  };

  logger[level](logData, `User registration ${event}`);
};

export const logLoginAttempt = (
  success: boolean,
  context: AuthContext & { error?: Error | string }
) => {
  const level: LogLevel = success ? 'info' : 'warn';
  const event = success ? 'login_success' : 'login_failure';
  const logData: BaseLogContext = {
    type: 'auth',
    event,
    ...context,
    ...(context.error && {
      error: context.error instanceof Error ? {
        message: context.error.message,
        stack: context.error.stack,
        name: context.error.name,
      } : { message: context.error },
    }),
  };

  logger[level](logData, success ? 'User login successful' : 'User login failed');
};

export const logPermissionDenied = (
  context: AuthContext & { resource?: string; action?: string; reason?: string }
) => {
  const logData: BaseLogContext = {
    type: 'auth',
    event: 'permission_denied',
    ...context,
  };

  logger.warn(logData, 'Permission denied');
};

