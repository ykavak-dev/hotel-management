import type { Request, Response, NextFunction } from 'express';
import { listUsers, updateUserRole, banUser, getUserActivity } from '../services/adminUser.service';
import { sendSuccess } from '../utils/response';
import { UserRole } from '../../generated/prisma';

export async function listUsersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const role = req.query.role as UserRole | undefined;
    const search = req.query.search as string | undefined;
    const result = await listUsers(page, limit, role, search);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function updateUserRoleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await updateUserRole(id, role, req.user!.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function banUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await banUser(id, req.user!.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function getUserActivityHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const activity = await getUserActivity(id);
    sendSuccess(res, activity);
  } catch (err) {
    next(err);
  }
}