import type { Request, Response, NextFunction } from 'express';
import { getDashboard } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export async function getDashboardHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await getDashboard();
    sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
}