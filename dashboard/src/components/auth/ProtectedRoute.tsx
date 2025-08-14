import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAppSelector } from '../../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  // BYPASS AUTH - This is a local dev tool, no auth needed
  // Simply return children without any auth checks
  return <>{children}</>;
  
  // Original auth logic commented out - will be removed in cleanup
  /*
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from login/register pages
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
  */
};

export default ProtectedRoute;