import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next): void => {
  logger.error(err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.errors.map((e) => ({
          path: e.path,
          message: e.message,
        })),
      },
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid JSON payload',
        code: 'INVALID_JSON',
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  const statusCode = (err as { statusCode?: number; status?: number }).statusCode
    ?? (err as { statusCode?: number; status?: number }).status
    ?? 500;
  const message = (err as Error).message ?? 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV !== 'production' && { stack: (err as Error).stack }),
    },
  });
};
