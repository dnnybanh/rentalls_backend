import logger from '../logger';
import { BaseLogContext } from './types';

export interface BusinessContext {
  userId?: string;
  resourceId?: string;
  operation?: string;
  [key: string]: any;
}

export const logBusinessEvent = (
  event: string,
  context: BusinessContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'business',
    event,
    ...context,
  };

  logger.info(logData, `Business event: ${event}`);
};

export const logBusinessError = (
  event: string,
  error: Error | string,
  context: BusinessContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'business',
    event: `${event}_error`,
    ...context,
    error: typeof error === 'string' ? { message: error } : {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  };

  logger.error(logData, `Business error: ${event}`);
};

