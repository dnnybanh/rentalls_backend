import logger from '../logger';
import { BaseLogContext } from './types';

export interface ValidationContext {
  field?: string;
  value?: any;
  reason?: string;
  schema?: string;
  [key: string]: any;
}

export const logValidationError = (
  field: string,
  value: any,
  reason: string,
  context: ValidationContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'validation',
    event: 'validation_error',
    field,
    value,
    reason,
    ...context,
  };

  logger.warn(logData, `Validation error: ${field} - ${reason}`);
};

export const logSchemaError = (
  error: Error | string,
  schema: string,
  context: ValidationContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'validation',
    event: 'schema_error',
    schema,
    ...context,
    error: typeof error === 'string' ? { message: error } : {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  };

  logger.error(logData, `Schema validation error: ${schema}`);
};

