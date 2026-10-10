import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { errorResponse } from '../utils/apiResponse.js';
import { ENV } from '../config/env.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled request error:', err);

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    errorResponse(res, `A record with this ${field} already exists.`, 409);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors: Record<string, string[]> = {};
    for (const key in err.errors) {
      errors[key] = [err.errors[key].message];
    }
    errorResponse(res, 'Database validation error', 400, errors);
    return;
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    errorResponse(res, `Invalid format for resource identifier: ${err.value}`, 400);
    return;
  }

  const message =
    ENV.NODE_ENV === 'production'
      ? 'An unexpected internal error occurred. Please try again later.'
      : err.message || 'Internal server error';

  errorResponse(res, message, err.statusCode || 500);
}
