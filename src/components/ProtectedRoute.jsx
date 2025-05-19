// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userData, loading, isUserLoggedIn } = useAuth();
  const location = useLocation(); 

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isUserLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!userData || !allowedRoles.includes(userData.role)) {

      console.warn(`Użytkownik ${currentUser.email} (rola: ${userData?.role}) próbował uzyskać dostęp do chronionej ścieżki wymagającej ról: ${allowedRoles.join(', ')}`);
      return <Navigate to="/" replace />; // Przekieruj na stronę główną
    }
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
