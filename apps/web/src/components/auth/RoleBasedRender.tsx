import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

interface RoleBasedRenderProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleBasedRender: React.FC<RoleBasedRenderProps> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};
