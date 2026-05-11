import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Requires auth only
export function AuthRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Requires auth + completed setup
export function SetupRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.setupDone) return <Navigate to="/setup" replace />;
  return children;
}
