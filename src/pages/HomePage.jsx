// src/pages/HomePage.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Zmień alias, jeśli używasz Link z MUI
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';


import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { isUserLoggedIn, userData, loading } = useAuth();

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
          
          <Box sx={{ marginTop: 4 }}>
            {userData && ( 
              <Typography variant="h6" gutterBottom>
                Cieszymy się, że jesteś z nami, {userData.firstName}!
              </Typography>
            )}
            <Button
              component={RouterLink}
              to="/my-bookings" 
              variant="contained"
              color="primary"
              size="large"
              sx={{ marginRight: 2 }}
            >
              Przejdź do Moich Rezerwacji
            </Button>
            
          </Box>
        ) : (
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
