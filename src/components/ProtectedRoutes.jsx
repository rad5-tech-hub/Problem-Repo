// src/components/ProtectedRoute.jsx
import { useAuth } from '../context/authcontexts';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingSpinner } from './LoadingSpinner'; // we'll create this simple one later

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}