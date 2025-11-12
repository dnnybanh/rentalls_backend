# Logger Documentation

This document provides comprehensive information on how to use the standardized logging helpers in the Rentalls backend application.

## Table of Contents

- [Overview](#overview)
- [Importing Loggers](#importing-loggers)
- [Log Levels](#log-levels)
- [Logger Categories](#logger-categories)
  - [Authentication & Authorization](#authentication--authorization)
  - [Database Operations](#database-operations)
  - [Validation](#validation)
  - [HTTP/API](#httpapi)
  - [Business Logic](#business-logic)
  - [Security](#security)
  - [Performance](#performance)
  - [Application Events](#application-events)
- [Best Practices](#best-practices)
- [Type Definitions](#type-definitions)

---

## Overview

The logging system is organized into category-specific modules, each containing helper functions for standardized logging. All loggers use Pino under the hood and produce structured JSON logs in production and pretty-printed logs in development.

### Directory Structure

```
src/utils/loggers/
├── types.ts              # Shared types and interfaces
├── auth.logger.ts        # Authentication & authorization
├── database.logger.ts    # Database operations
├── validation.logger.ts  # Input validation
├── api.logger.ts         # HTTP/API requests
├── business.logger.ts    # Business logic events
├── security.logger.ts    # Security events
├── performance.logger.ts # Performance metrics
├── application.logger.ts # Application/system events
└── index.ts              # Barrel export
```

---

## Importing Loggers

You can import loggers in two ways:

### Option 1: Import from Barrel Export (Recommended)

```typescript
import { 
  logRegistration, 
  logDatabaseError, 
  logValidationError 
} from '../utils/loggers';
```

### Option 2: Import from Specific Files

```typescript
import { logRegistration } from '../utils/loggers/auth.logger';
import { logDatabaseError } from '../utils/loggers/database.logger';
```

---

## Log Levels

The logging system supports four log levels:

- **`error`** - Critical errors that require immediate attention
- **`warn`** - Warning conditions that may need attention
- **`info`** - Informational messages about normal operations
- **`debug`** - Detailed diagnostic information (typically only in development)

---

## Logger Categories

### Authentication & Authorization

Location: `src/utils/loggers/auth.logger.ts`

#### `logAuthEvent(event: string, level: LogLevel, context?: AuthContext)`

Logs general authentication and authorization events.

**Parameters:**
- `event` (string) - The event name (e.g., "token_refresh", "session_expired")
- `level` (LogLevel) - The log level: 'error' | 'warn' | 'info' | 'debug'
- `context` (AuthContext, optional) - Additional context data

**AuthContext Interface:**
```typescript
{
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}
```

**Example:**
```typescript
import { logAuthEvent } from '../utils/loggers';

logAuthEvent('token_refresh', 'info', {
  userId: '123',
  email: 'user@example.com',
  ip: req.ip
});
```

---

#### `logRegistration(event: 'attempt' | 'success' | 'failure', context: AuthContext)`

Logs user registration events with automatic log level selection.

**Parameters:**
- `event` - Either 'attempt', 'success', or 'failure'
- `context` - Context object with user information

**Log Levels:**
- `attempt` → `info`
- `success` → `info`
- `failure` → `error`

**Example:**
```typescript
import { logRegistration } from '../utils/loggers';

// Registration attempt
logRegistration('attempt', {
  email: 'user@example.com',
  fullName: 'John Doe',
  ip: req.ip,
  userAgent: req.get('user-agent')
});

// Registration success
logRegistration('success', {
  email: 'user@example.com',
  fullName: 'John Doe'
});

// Registration failure
logRegistration('failure', {
  email: 'user@example.com',
  fullName: 'John Doe',
  error: new Error('Email already exists'),
  ip: req.ip
});
```

---

#### `logLoginAttempt(success: boolean, context: AuthContext)`

Logs login attempts with automatic success/failure handling.

**Parameters:**
- `success` (boolean) - Whether the login was successful
- `context` (AuthContext) - Context object with user information

**Log Levels:**
- Success → `info`
- Failure → `warn`

**Example:**
```typescript
import { logLoginAttempt } from '../utils/loggers';

// Successful login
logLoginAttempt(true, {
  userId: '123',
  email: 'user@example.com',
  ip: req.ip
});

// Failed login
logLoginAttempt(false, {
  email: 'user@example.com',
  error: 'Invalid credentials',
  ip: req.ip
});
```

---

#### `logPermissionDenied(context: AuthContext)`

Logs permission denied events (always logs at `warn` level).

**Parameters:**
- `context` (AuthContext) - Context object with resource and action information

**Example:**
```typescript
import { logPermissionDenied } from '../utils/loggers';

logPermissionDenied({
  userId: '123',
  resource: '/api/admin/users',
  action: 'DELETE',
  reason: 'Insufficient permissions',
  ip: req.ip
});
```

---

### Database Operations

Location: `src/utils/loggers/database.logger.ts`

#### `logDatabaseError(error: Error, context?: DatabaseContext)`

Logs database operation errors with full error details.

**Parameters:**
- `error` (Error) - The error object
- `context` (DatabaseContext, optional) - Additional context

**DatabaseContext Interface:**
```typescript
{
  query?: string;
  table?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}
```

**Example:**
```typescript
import { logDatabaseError } from '../utils/loggers';

try {
  await db.query('SELECT * FROM users');
} catch (error) {
  logDatabaseError(error as Error, {
    query: 'SELECT * FROM users',
    table: 'users',
    operation: 'SELECT'
  });
}
```

---

#### `logDatabaseConnection(event: 'connected' | 'disconnected' | 'error', context?: DatabaseContext)`

Logs database connection events.

**Parameters:**
- `event` - Connection event type
- `context` (DatabaseContext, optional) - Additional context

**Log Levels:**
- `connected` → `info`
- `disconnected` → `info`
- `error` → `error`

**Example:**
```typescript
import { logDatabaseConnection } from '../utils/loggers';

// On successful connection
logDatabaseConnection('connected', {
  host: 'localhost',
  database: 'rentalls_db'
});

// On connection error
logDatabaseConnection('error', {
  error: new Error('Connection timeout'),
  host: 'localhost'
});
```

---

#### `logSlowQuery(query: string, duration: number, threshold?: number, context?: DatabaseContext)`

Logs slow database queries that exceed a threshold (default: 1000ms).

**Parameters:**
- `query` (string) - The SQL query
- `duration` (number) - Query execution time in milliseconds
- `threshold` (number, optional) - Threshold in ms (default: 1000)
- `context` (DatabaseContext, optional) - Additional context

**Example:**
```typescript
import { logSlowQuery } from '../utils/loggers';

const startTime = Date.now();
await db.query('SELECT * FROM large_table');
const duration = Date.now() - startTime;

if (duration > 1000) {
  logSlowQuery(
    'SELECT * FROM large_table',
    duration,
    1000,
    { table: 'large_table' }
  );
}
```

---

### Validation

Location: `src/utils/loggers/validation.logger.ts`

#### `logValidationError(field: string, value: any, reason: string, context?: ValidationContext)`

Logs field-level validation errors.

**Parameters:**
- `field` (string) - The field name that failed validation
- `value` (any) - The invalid value
- `reason` (string) - Why validation failed
- `context` (ValidationContext, optional) - Additional context

**ValidationContext Interface:**
```typescript
{
  field?: string;
  value?: any;
  reason?: string;
  schema?: string;
  [key: string]: any;
}
```

**Example:**
```typescript
import { logValidationError } from '../utils/loggers';

if (!isValidEmail(email)) {
  logValidationError(
    'email',
    email,
    'Invalid email format',
    { schema: 'user_registration' }
  );
}
```

---

#### `logSchemaError(error: Error | string, schema: string, context?: ValidationContext)`

Logs schema validation errors.

**Parameters:**
- `error` (Error | string) - The validation error
- `schema` (string) - The schema name that failed
- `context` (ValidationContext, optional) - Additional context

**Example:**
```typescript
import { logSchemaError } from '../utils/loggers';

try {
  validateSchema(userData, userSchema);
} catch (error) {
  logSchemaError(
    error as Error,
    'user_registration_schema',
    { userId: req.body.userId }
  );
}
```

---

### HTTP/API

Location: `src/utils/loggers/api.logger.ts`

#### `logApiCall(service: string, method: string, url: string, context?: ApiContext)`

Logs outgoing API calls to external services.

**Parameters:**
- `service` (string) - Name of the external service
- `method` (string) - HTTP method (GET, POST, etc.)
- `url` (string) - API endpoint URL
- `context` (ApiContext, optional) - Additional context

**ApiContext Interface:**
```typescript
{
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}
```

**Example:**
```typescript
import { logApiCall } from '../utils/loggers';

logApiCall('payment_gateway', 'POST', 'https://api.payment.com/charge', {
  responseTime: 250,
  statusCode: 200
});
```

---

#### `logApiError(service: string, error: Error | string, context?: ApiContext)`

Logs errors from external API calls.

**Parameters:**
- `service` (string) - Name of the external service
- `error` (Error | string) - The error
- `context` (ApiContext, optional) - Additional context

**Example:**
```typescript
import { logApiError } from '../utils/loggers';

try {
  await paymentGateway.charge(amount);
} catch (error) {
  logApiError(
    'payment_gateway',
    error as Error,
    { amount, userId: '123' }
  );
}
```

---

#### `logRequestError(req: Request, error: Error, statusCode?: number, context?: ApiContext)`

Logs HTTP request processing errors with full request context.

**Parameters:**
- `req` (Request) - Express request object
- `error` (Error) - The error that occurred
- `statusCode` (number, optional) - HTTP status code (default: 500)
- `context` (ApiContext, optional) - Additional context

**Example:**
```typescript
import { logRequestError } from '../utils/loggers';

app.use((err, req, res, next) => {
  logRequestError(req, err, err.statusCode || 500);
  res.status(err.statusCode || 500).json({ error: err.message });
});
```

---

### Business Logic

Location: `src/utils/loggers/business.logger.ts`

#### `logBusinessEvent(event: string, context?: BusinessContext)`

Logs business logic events and milestones.

**Parameters:**
- `event` (string) - The business event name
- `context` (BusinessContext, optional) - Additional context

**BusinessContext Interface:**
```typescript
{
  userId?: string;
  resourceId?: string;
  operation?: string;
  [key: string]: any;
}
```

**Example:**
```typescript
import { logBusinessEvent } from '../utils/loggers';

logBusinessEvent('rental_created', {
  userId: '123',
  resourceId: 'rental_456',
  operation: 'create',
  rentalType: 'apartment',
  duration: '6_months'
});
```

---

#### `logBusinessError(event: string, error: Error | string, context?: BusinessContext)`

Logs business logic errors and rule violations.

**Parameters:**
- `event` (string) - The business event name
- `error` (Error | string) - The error
- `context` (BusinessContext, optional) - Additional context

**Example:**
```typescript
import { logBusinessError } from '../utils/loggers';

try {
  processRentalPayment(rentalId, amount);
} catch (error) {
  logBusinessError(
    'rental_payment',
    error as Error,
    { rentalId, amount, userId: '123' }
  );
}
```

---

### Security

Location: `src/utils/loggers/security.logger.ts`

#### `logSecurityEvent(event: string, level: LogLevel, context?: SecurityContext)`

Logs security-related events.

**Parameters:**
- `event` (string) - The security event name
- `level` (LogLevel) - The log level
- `context` (SecurityContext, optional) - Additional context

**SecurityContext Interface:**
```typescript
{
  userId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  [key: string]: any;
}
```

**Example:**
```typescript
import { logSecurityEvent } from '../utils/loggers';

logSecurityEvent('suspicious_activity', 'warn', {
  userId: '123',
  ip: req.ip,
  resource: '/api/admin',
  action: 'unauthorized_access_attempt'
});
```

---

#### `logFailedAuthAttempt(context: SecurityContext)`

Logs failed authentication attempts (always logs at `warn` level).

**Parameters:**
- `context` (SecurityContext) - Context with attempt information

**Example:**
```typescript
import { logFailedAuthAttempt } from '../utils/loggers';

logFailedAuthAttempt({
  email: 'user@example.com',
  ip: req.ip,
  reason: 'Invalid password',
  attemptCount: 3
});
```

---

### Performance

Location: `src/utils/loggers/performance.logger.ts`

#### `logPerformance(operation: string, duration: number, context?: PerformanceContext)`

Logs performance metrics for operations.

**Parameters:**
- `operation` (string) - Name of the operation
- `duration` (number) - Duration in milliseconds
- `context` (PerformanceContext, optional) - Additional context

**PerformanceContext Interface:**
```typescript
{
  operation?: string;
  duration?: number;
  threshold?: number;
  [key: string]: any;
}
```

**Example:**
```typescript
import { logPerformance } from '../utils/loggers';

const startTime = Date.now();
await processLargeDataset();
const duration = Date.now() - startTime;

logPerformance('process_large_dataset', duration, {
  recordCount: 10000,
  memoryUsage: process.memoryUsage().heapUsed
});
```

---

#### `logTimeout(operation: string, timeout: number, context?: PerformanceContext)`

Logs operation timeouts.

**Parameters:**
- `operation` (string) - Name of the operation
- `timeout` (number) - Timeout threshold in milliseconds
- `context` (PerformanceContext, optional) - Additional context

**Example:**
```typescript
import { logTimeout } from '../utils/loggers';

if (operationDuration > timeoutThreshold) {
  logTimeout('external_api_call', timeoutThreshold, {
    service: 'payment_gateway',
    actualDuration: operationDuration
  });
}
```

---

### Application Events

Location: `src/utils/loggers/application.logger.ts`

#### `logApplicationEvent(event: string, level: LogLevel, context?: ApplicationContext)`

Logs general application events.

**Parameters:**
- `event` (string) - The event name
- `level` (LogLevel) - The log level
- `context` (ApplicationContext, optional) - Additional context

**ApplicationContext Interface:**
```typescript
{
  component?: string;
  [key: string]: any;
}
```

**Example:**
```typescript
import { logApplicationEvent } from '../utils/loggers';

logApplicationEvent('cache_cleared', 'info', {
  component: 'cache_manager',
  cacheType: 'user_sessions'
});
```

---

#### `logSystemEvent(event: 'startup' | 'shutdown' | 'config_change' | 'health_check', context?: ApplicationContext)`

Logs system-level events with automatic log level selection.

**Parameters:**
- `event` - System event type
- `context` (ApplicationContext, optional) - Additional context

**Log Levels:**
- `startup` → `info`
- `shutdown` → `warn`
- `config_change` → `info`
- `health_check` → `info`

**Example:**
```typescript
import { logSystemEvent } from '../utils/loggers';

// Server startup
app.listen(PORT, () => {
  logSystemEvent('startup', { port: PORT });
});

// Server shutdown
process.on('SIGTERM', () => {
  logSystemEvent('shutdown', { signal: 'SIGTERM' });
});

// Health check
app.get('/health', (req, res) => {
  logSystemEvent('health_check', { timestamp: Date.now() });
  res.json({ status: 'ok' });
});
```

---

## Best Practices

### 1. Use Appropriate Log Levels

- **`error`**: Critical errors that require immediate attention
- **`warn`**: Warning conditions (failed auth attempts, slow queries, timeouts)
- **`info`**: Normal operations (successful logins, business events, API calls)
- **`debug`**: Detailed diagnostic information (only in development)

### 2. Include Relevant Context

Always include relevant context data to help with debugging:

```typescript
// Good
logDatabaseError(error, {
  query: 'SELECT * FROM users',
  table: 'users',
  userId: '123'
});

// Bad
logDatabaseError(error);
```

### 3. Don't Log Sensitive Information

Never log passwords, tokens, or other sensitive data:

```typescript
// Good
logRegistration('attempt', {
  email: 'user@example.com',
  ip: req.ip
});

// Bad
logRegistration('attempt', {
  email: 'user@example.com',
  password: req.body.password, // NEVER DO THIS
  ip: req.ip
});
```

### 4. Use Specific Logger Functions

Use category-specific loggers instead of generic logging:

```typescript
// Good
logRegistration('success', { email, fullName });

// Bad
logger.info({ type: 'auth', event: 'registration_success', email, fullName });
```

### 5. Handle Errors Properly

Always pass Error objects when available for full stack traces:

```typescript
// Good
try {
  await dbOperation();
} catch (error) {
  logDatabaseError(error as Error, { operation: 'select_users' });
}

// Bad
try {
  await dbOperation();
} catch (error) {
  logDatabaseError(new Error('Database operation failed'), { operation: 'select_users' });
}
```

---

## Type Definitions

### LogType

```typescript
type LogType = 'auth' | 'database' | 'validation' | 'api' | 'business' | 'security' | 'performance' | 'application';
```

### LogLevel

```typescript
type LogLevel = 'error' | 'warn' | 'info' | 'debug';
```

### BaseLogContext

All loggers include a base context with:
- `type`: The log category
- `event`: The specific event name
- Additional context fields as needed

---

## Summary

This logging system provides:

- ✅ **Standardized structure** across all logs
- ✅ **Category-specific helpers** for easy discovery
- ✅ **Type safety** with TypeScript interfaces
- ✅ **Automatic log level selection** for common scenarios
- ✅ **Consistent error handling** with full stack traces
- ✅ **Easy to extend** with additional context fields

For questions or issues, refer to the individual logger files or contact the development team.

