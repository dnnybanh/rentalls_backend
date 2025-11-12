export type LogType = 'auth' | 'database' | 'validation' | 'api' | 'business' | 'security' | 'performance' | 'application';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface BaseLogContext {
  type: LogType;
  event: string;
  [key: string]: any;
}

