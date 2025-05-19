// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Importuj AuthProvider
import { AuthProvider } from './contexts/AuthContext'; 
import { SnackbarProvider } from './contexts/SnackbarContext';

const theme = createTheme({
  // MUI
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
      <AuthProvider> {}
        <App />
      </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>
);
