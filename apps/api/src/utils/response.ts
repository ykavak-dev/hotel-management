import type { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  code: string = 'INTERNAL_ERROR',
  statusCode: number = 500,
  details?: unknown,
): void {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      message,
      code,
      ...(details !== undefined && { details }),
    },
  };
  res.status(statusCode).json(response);
}
