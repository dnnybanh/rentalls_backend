import logger from '../logger';
import { BaseLogContext } from './types';

export interface PerformanceContext {
  operation?: string;
  duration?: number;
  threshold?: number;
  [key: string]: any;
}

export const logPerformance = (
  operation: string,
  duration: number,
  context: PerformanceContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'performance',
    event: 'performance_metric',
    operation,
    duration,
    ...context,
  };

  logger.info(logData, `Performance: ${operation} took ${duration}ms`);
};

export const logTimeout = (
  operation: string,
  timeout: number,
  context: PerformanceContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'performance',
    event: 'operation_timeout',
    operation,
    timeout,
    ...context,
  };

  logger.warn(logData, `Operation timeout: ${operation} exceeded ${timeout}ms`);
};

