import logger from '../logger';
import { BaseLogContext, LogLevel } from './types';

export interface DatabaseContext {
  query?: string;
  table?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

export const logDatabaseError = (
  error: Error,
  context: DatabaseContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'database',
    event: 'database_error',
    ...context,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  };

  logger.error(logData, 'Database operation failed');
};

export const logDatabaseConnection = (
  event: 'connected' | 'disconnected' | 'error',
  context: DatabaseContext & { error?: Error } = {}
) => {
  const level: LogLevel = event === 'error' ? 'error' : 'info';
  const logData: BaseLogContext = {
    type: 'database',
    event: `database_connection_${event}`,
    ...context,
    ...(context.error && {
      error: {
        message: context.error.message,
        stack: context.error.stack,
        name: context.error.name,
      },
    }),
  };

  logger[level](logData, `Database connection ${event}`);
};

export const logSlowQuery = (
  query: string,
  duration: number,
  threshold: number = 1000,
  context: DatabaseContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'database',
    event: 'slow_query',
    query,
    duration,
    threshold,
    ...context,
  };

  logger.warn(logData, `Slow query detected (${duration}ms > ${threshold}ms)`);
};

