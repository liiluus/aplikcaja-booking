// src/pages/HomePage.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Zmień alias, jeśli używasz Link z MUI
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

// Importuj useAuth
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  // Pobierz informacje z AuthContext
  const { isUserLoggedIn, userData, loading } = useAuth();

  // Jeśli stan autentykacji jest jeszcze ładowany, możesz pokazać wskaźnik ładowania
  // lub prosty komunikat, aby uniknąć migotania.
  // W AuthProvider mamy już {!loading && children}, więc tutaj może to nie być konieczne,
  // ale dla pewności można dodać.
  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ marginTop: 8, textAlign: 'center' }}>
          <Typography variant="h5">Ładowanie...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Witaj w Systemie Rezerwacji Spotkań!
        </Typography>
        <Typography variant="h5" component="p" color="text.secondary" paragraph>
          Zarządzaj swoimi spotkaniami łatwo i efektywnie.
        </Typography>

        {isUserLoggedIn ? (
          // Treść dla zalogowanego użytkownika
          <Box sx={{ marginTop: 4 }}>
            {userData && ( // Sprawdź, czy userData jest dostępne
              <Typography variant="h6" gutterBottom>
                Cieszymy się, że jesteś z nami, {userData.firstName}!
              </Typography>
            )}
            <Button
              component={RouterLink}
              to="/my-bookings" // Lub np. do kalendarza
              variant="contained"
              color="primary"
              size="large"
              sx={{ marginRight: 2 }}
            >
              Przejdź do Moich Rezerwacji
            </Button>
            {/* Możesz dodać inne przyciski akcji dla zalogowanego użytkownika */}
          </Box>
        ) : (
          // Treść dla niezalogowanego użytkownika (tak jak było wcześniej)
          <Box sx={{ marginTop: 4 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              color="primary"
              size="large"
              sx={{ marginRight: 2 }}
            >
              Logowanie
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              variant="outlined"
              color="primary"
              size="large"
            >
              Rejestracja
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default HomePage;
