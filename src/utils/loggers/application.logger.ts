import logger from '../logger';
import { BaseLogContext, LogLevel } from './types';

export interface ApplicationContext {
  component?: string;
  [key: string]: any;
}

export const logApplicationEvent = (
  event: string,
  level: LogLevel,
  context: ApplicationContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'application',
    event,
    ...context,
  };

  logger[level](logData, `Application event: ${event}`);
};

export const logSystemEvent = (
  event: 'startup' | 'shutdown' | 'config_change' | 'health_check',
  context: ApplicationContext = {}
) => {
  const level: LogLevel = event === 'shutdown' ? 'warn' : 'info';
  const logData: BaseLogContext = {
    type: 'application',
    event: `system_${event}`,
    ...context,
  };

  logger[level](logData, `System event: ${event}`);
};

