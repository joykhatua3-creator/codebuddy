import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const homeFor = (role) => (role === 'teacher' ? '/teacher' : '/dashboard');

// <ProtectedRoute />                     -> any logged-in user
// <ProtectedRoute roles={['teacher']} /> -> only those roles
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="p-8 text-[#5B6385]">Checking your session…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;

  return <Outlet />;
}

// For /login and /register: logged-in users skip straight to their home
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}
