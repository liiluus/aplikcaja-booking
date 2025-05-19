// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Importuj useAuth
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// Props:
// - children: Alternatywny sposób przekazywania komponentu do renderowania (zamiast <Outlet />)
// - allowedRoles: Tablica ról, które mają dostęp (np. ['admin', 'user'] lub ['admin'])
//                 Jeśli nie podane, wystarczy, że użytkownik jest zalogowany.
function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userData, loading, isUserLoggedIn } = useAuth();
  const location = useLocation(); // Aby zapamiętać, skąd użytkownik przyszedł

  if (loading) {
    // Wyświetl wskaźnik ładowania, dopóki stan autentykacji nie zostanie ustalony
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isUserLoggedIn) {
    // Użytkownik nie jest zalogowany, przekieruj na stronę logowania
    // Przekazujemy `location` w stanie, aby po zalogowaniu móc wrócić na tę stronę
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Sprawdzenie ról, jeśli `allowedRoles` jest zdefiniowane
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userData || !allowedRoles.includes(userData.role)) {
      // Użytkownik jest zalogowany, ale nie ma wymaganej roli
      // Można przekierować na stronę "Brak dostępu" (np. /unauthorized)
      // lub na stronę główną
      console.warn(`Użytkownik ${currentUser.email} (rola: ${userData?.role}) próbował uzyskać dostęp do chronionej ścieżki wymagającej ról: ${allowedRoles.join(', ')}`);
      return <Navigate to="/" replace />; // Przekieruj na stronę główną
    }
  }

  // Użytkownik jest zalogowany i (jeśli sprawdzano) ma odpowiednią rolę
  // Renderuj komponent docelowy (przekazany jako children lub przez <Outlet /> w definicji Route)
  return children ? children : <Outlet />;
}

export default ProtectedRoute;
