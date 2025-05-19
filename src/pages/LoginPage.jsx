// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useAuth } from '../contexts/AuthContext';

// Komponenty MUI
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress'; // Dodano
// Usunięto import Alert

// Import Firebase
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { showSnackbar } = useSnackbar();
  // Usunięto stan firebaseError

  const { isUserLoggedIn, loading: authLoading } = useAuth();
  const from = location.state?.from?.pathname || '/';

  // Wyświetl komunikat o sukcesie z rejestracji, jeśli istnieje
  useEffect(() => {
    if (location.state?.message) {
      showSnackbar(location.state.message, 'success');
      // Czyść stan w historii, aby komunikat nie pojawiał się ponownie po odświeżeniu
      // lub przejściu wstecz/dalej i powrocie.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, showSnackbar, navigate, location.pathname]);

  useEffect(() => {
    if (!authLoading && isUserLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [isUserLoggedIn, authLoading, navigate, from]);

  const onSubmit = async (data) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      showSnackbar('Zalogowano pomyślnie!', 'success');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Błąd logowania Firebase:', error.code, error.message);
      let friendlyMessage = 'Wystąpił błąd podczas logowania. Sprawdź dane i spróbuj ponownie.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        friendlyMessage = 'Nieprawidłowy adres email lub hasło.';
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = 'Podany adres email jest nieprawidłowy.';
      }
      showSnackbar(friendlyMessage, 'error');
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOpenOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Zaloguj się
        </Typography>
        {/* Alerty zostały usunięte, błędy i sukcesy obsługuje Snackbar */}
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 3 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Adres Email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                {...register('email', {
                  required: 'Adres email jest wymagany.',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Nieprawidłowy format adresu email.',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Hasło"
                type="password"
                id="password"
                autoComplete="current-password"
                {...register('password', {
                  required: 'Hasło jest wymagane.',
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isSubmitting}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Zaloguj się'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                Nie masz konta? Zarejestruj się
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
export default LoginPage;
