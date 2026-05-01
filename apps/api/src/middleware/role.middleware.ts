import type { Request, Response, NextFunction } from 'express';

import type { UserRole } from '../../generated/prisma';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden: insufficient permissions', code: 'FORBIDDEN' },
      });
      return;
    }

    next();
  };
}
