import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { apiRouter } from './routes/api.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { errorResponse } from './utils/apiResponse.js';

export const app = express();

// Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const allowed = [ENV.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (allowed.includes(origin) || ENV.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

// Body Parsers with safe limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'FleetFlow SaaS API',
    status: 'online',
    phase: 'Phase 1 - Foundation, Auth & Core Platform',
    docs: '/api/health',
  });
});

// Main API Router
app.use('/api', apiRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  errorResponse(res, 'Requested resource endpoint was not found.', 404);
});

// Centralized Error Middleware
app.use(errorHandler);
