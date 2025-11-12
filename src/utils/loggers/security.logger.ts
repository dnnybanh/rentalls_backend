import logger from '../logger';
import { BaseLogContext, LogLevel } from './types';

export interface SecurityContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  [key: string]: any;
}

export const logSecurityEvent = (
  event: string,
  level: LogLevel,
  context: SecurityContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'security',
    event,
    ...context,
  };

  logger[level](logData, `Security event: ${event}`);
};

export const logFailedAuthAttempt = (
  context: SecurityContext & { email?: string; reason?: string; attemptCount?: number }
) => {
  const logData: BaseLogContext = {
    type: 'security',
    event: 'failed_auth_attempt',
    ...context,
  };

  logger.warn(logData, 'Failed authentication attempt');
};

