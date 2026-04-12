import { Navigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../../utils/auth';

export default function RequireRole({ allowedRole, children }) {
  const session = getAuthSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== allowedRole) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }

  return children;
}
