// src/pages/RegisterPage.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSnackbar } from '../contexts/SnackbarContext';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress'; 

import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({ mode: 'onTouched' });

  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: 'user',
        createdAt: new Date(),
      });

      navigate('/login', {
        state: { message: 'Rejestracja zakończona sukcesem! Możesz się teraz zalogować.' },
        replace: true,
      });

    } catch (error) {
      console.error('Błąd rejestracji Firebase:', error);
      let friendlyMessage = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'Ten adres email jest już zajęty.';
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = 'Hasło jest zbyt słabe. Powinno mieć co najmniej 6 znaków.';
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = 'Podany adres email jest nieprawidłowy.';
      }
      showSnackbar(friendlyMessage, 'error');
    }
  };

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
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Zarejestruj się
        </Typography>
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 3 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="given-name"
                name="firstName"
                required
                fullWidth
                id="firstName"
                label="Imię"
                autoFocus
                {...register('firstName', {
                  required: 'Imię jest wymagane',
                  minLength: { value: 2, message: 'Imię musi mieć co najmniej 2 znaki' },
                })}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="lastName"
                label="Nazwisko"
                name="lastName"
                autoComplete="family-name"
                {...register('lastName', {
                  required: 'Nazwisko jest wymagane',
                  minLength: { value: 2, message: 'Nazwisko musi mieć co najmniej 2 znaki' },
                })}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Adres Email"
                name="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email jest wymagany',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Nieprawidłowy format adresu email',
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
                autoComplete="new-password"
                {...register('password', {
                  required: 'Hasło jest wymagane',
                  minLength: { value: 6, message: 'Hasło musi mieć co najmniej 6 znaków' },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Potwierdź Hasło"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Potwierdzenie hasła jest wymagane',
                  validate: (value) =>
                    value === password || 'Hasła nie są zgodne',
                })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
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
            {isSubmitting ? <CircularProgress size={24} /> : 'Zarejestruj się'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Masz już konto? Zaloguj się
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
export default RegisterPage;
