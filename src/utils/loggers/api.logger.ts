import { Request } from 'express';
import logger from '../logger';
import { BaseLogContext } from './types';

export interface ApiContext {
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

export const logApiCall = (
  service: string,
  method: string,
  url: string,
  context: ApiContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'api',
    event: 'api_call',
    service,
    method,
    url,
    ...context,
  };

  logger.info(logData, `API call: ${method} ${url}`);
};

export const logApiError = (
  service: string,
  error: Error | string,
  context: ApiContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'api',
    event: 'api_error',
    service,
    ...context,
    error: typeof error === 'string' ? { message: error } : {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  };

  logger.error(logData, `API error: ${service}`);
};

export const logRequestError = (
  req: Request,
  error: Error,
  statusCode?: number,
  context: ApiContext = {}
) => {
  const logData: BaseLogContext = {
    type: 'api',
    event: 'request_error',
    method: req.method,
    url: req.url,
    statusCode: statusCode || 500,
    ...context,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    },
  };

  logger.error(logData, `Request error: ${req.method} ${req.url}`);
};

