// src/pages/NewBookingPage.jsx
import React, { useState } from 'react'; // useState może być potrzebny dla lokalnych błędów walidacji formularza
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useSnackbar } from '../contexts/SnackbarContext';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';

function NewBookingPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      participants: '',
    },
  });

  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showSnackbar } = useSnackbar();

  const onSubmit = async (data) => {
    if (!currentUser) {
      showSnackbar('Musisz być zalogowany, aby dodać rezerwację.', 'error');
      return;
    }

    const meetingDate = data.date;
    const startTimeString = data.startTime;
    const endTimeString = data.endTime;

    const startDateTime = new Date(`${meetingDate}T${startTimeString}:00`);
    const endDateTime = new Date(`${meetingDate}T${endTimeString}:00`);

    if (isNaN(startDateTime.valueOf()) || isNaN(endDateTime.valueOf())) {
      showSnackbar('Nieprawidłowy format daty lub godziny.', 'error');
      return;
    }
    if (endDateTime <= startDateTime) {
      showSnackbar('Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia.', 'error');
      return;
    }
    const now = new Date();
    const todayForComparison = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const meetingDateForComparison = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());

    if (meetingDateForComparison < todayForComparison) {
      showSnackbar('Nie można rezerwować spotkań na przeszłe daty.', 'error');
      return;
    }
    if (meetingDateForComparison.getTime() === todayForComparison.getTime() && startDateTime < now) {
      showSnackbar('Nie można rezerwować spotkań w przeszłości (dzisiaj, wcześniejsza godzina).', 'error');
      return;
    }

    const participantsArray = data.participants
      ? data.participants.split(',').map(email => email.trim()).filter(email => email !== '')
      : [];

    try {
      const newBookingData = {
        title: data.title,
        description: data.description || '',
        date: Timestamp.fromDate(startDateTime),
        startTime: data.startTime,
        endTime: data.endTime,
        participants: participantsArray,
        createdBy: currentUser.uid,
        status: 'scheduled',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'meetings'), newBookingData);
      showSnackbar('Nowa rezerwacja została pomyślnie dodana!', 'success');
      reset();
      navigate('/my-bookings'); 
    } catch (error) {
      console.error('Błąd podczas dodawania rezerwacji: ', error);
      showSnackbar('Nie udało się dodać rezerwacji. Spróbuj ponownie.', 'error');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dodaj Nową Rezerwację
      </Typography>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Tytuł spotkania"
              fullWidth
              required
              {...register('title', { required: 'Tytuł jest wymagany.' })}
              error={!!errors.title}
              helperText={errors.title?.message}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Opis (opcjonalnie)"
              fullWidth
              multiline
              rows={3}
              {...register('description')}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Data spotkania"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              {...register('date', { required: 'Data jest wymagana.' })}
              error={!!errors.date}
              helperText={errors.date?.message}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Godzina rozpoczęcia"
              type="time"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              {...register('startTime', { required: 'Godzina rozpoczęcia jest wymagana.' })}
              error={!!errors.startTime}
              helperText={errors.startTime?.message}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Godzina zakończenia"
              type="time"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              {...register('endTime', { required: 'Godzina zakończenia jest wymagana.' })}
              error={!!errors.endTime}
              helperText={errors.endTime?.message}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Uczestnicy (adresy email oddzielone przecinkami)"
              fullWidth
              {...register('participants')}
              helperText="Np. jan@example.com, anna@example.com"
              disabled={isSubmitting}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSubmitting}
          sx={{ mt: 3 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Dodaj Rezerwację'}
        </Button>
      </Box>
    </Container>
  );
}
export default NewBookingPage;
