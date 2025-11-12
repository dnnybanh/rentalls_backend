import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from './utils/logger';
import { logSystemEvent } from './utils/loggers';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// HTTP Request Logging Middleware
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} completed`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} errored`;
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
        },
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.headers['content-type'],
        },
      }),
    },
  })
);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', authRoutes);

// Error Handling Middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logSystemEvent('startup', { port: PORT });
});

// Graceful shutdown logging
process.on('SIGTERM', () => {
  logSystemEvent('shutdown', { signal: 'SIGTERM' });
  process.exit(0);
});

process.on('SIGINT', () => {
  logSystemEvent('shutdown', { signal: 'SIGINT' });
  process.exit(0);
});

