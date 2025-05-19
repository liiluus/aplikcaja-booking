// src/layouts/Navbar.jsx
import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box'; 
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CircularProgress from '@mui/material/CircularProgress';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Ikona dla panelu admina

function Navbar() {
  const { currentUser, userData, logout, loading, isUserLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Użytkownik wylogowany');
      navigate('/login');
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    }
  };

  if (loading) {
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            System Rezerwacji
          </Typography>
          <CircularProgress color="inherit" size={24} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
        >
          System Rezerwacji
        </Typography>

        {/* Link do Panelu Admina - widoczny tylko dla zalogowanych adminów */}
        {isUserLoggedIn && isAdmin && (
          <Button
            color="inherit"
            component={RouterLink}
            to="/admin-dashboard"
            startIcon={<AdminPanelSettingsIcon />}
            sx={{ ml: 1 }} 
          >
            Panel Admina
          </Button>
        )}

        {/* Linki dla wszystkich zalogowanych użytkowników (w tym adminów) */}
        {isUserLoggedIn && (
          <>
            <Button
              color="inherit"
              component={RouterLink}
              to="/my-bookings"
              startIcon={<ListAltIcon />}
              sx={{ ml: isAdmin ? 0 : 1 }}
            >
              Moje Rezerwacje
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/calendar"
              startIcon={<CalendarMonthIcon />}
              sx={{ ml: 1 }}
            >
              Kalendarz
            </Button>
          </>
        )}

        {/* Informacje o użytkowniku i przycisk wylogowania - dla wszystkich zalogowanych */}
        {isUserLoggedIn && (
          <>
            {userData && (
              <Typography sx={{ ml: 2, mr: 1 }}>
                Witaj, {userData.firstName || currentUser.email}
              </Typography>
            )}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={() => { /* Można tu otworzyć menu użytkownika */ }}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Button color="inherit" onClick={handleLogout}>
              Wyloguj
            </Button>
          </>
        )}

        {!isUserLoggedIn && (
          <>
            <Button color="inherit" component={RouterLink} to="/login">
              Logowanie
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Rejestracja
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
