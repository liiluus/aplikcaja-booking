// src/pages/EditBookingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useSnackbar } from '../contexts/SnackbarContext';

// Komponenty MUI
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';

function EditBookingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [pageError, setPageError] = useState('');
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [initialData, setInitialData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm();

  const fetchBookingData = useCallback(async () => {
    console.log('EditBookingPage - fetchBookingData: Uruchomiono');
    if (!bookingId) {
      console.log('EditBookingPage - fetchBookingData: Brak bookingId');
      setPageError('Brak ID rezerwacji do edycji.');
      setLoadingBooking(false);
      return;
    }
    if (!currentUser) {
      console.log('EditBookingPage - fetchBookingData: Brak currentUser');
      // ProtectedRoute powinien to obsłużyć, ale dla pewności
      setPageError('Musisz być zalogowany, aby edytować rezerwację.');
      setLoadingBooking(false);
      return;
    }

    setLoadingBooking(true);
    setPageError('');
    try {
      console.log(`EditBookingPage - fetchBookingData: Pobieranie rezerwacji o ID: ${bookingId}`);
      const bookingRef = doc(db, 'meetings', bookingId);
      const docSnap = await getDoc(bookingRef);

      if (docSnap.exists()) {
        const bookingData = docSnap.data();
        console.log('EditBookingPage - fetchBookingData: Dane rezerwacji pobrane:', bookingData);

        console.log('EditBookingPage - Sprawdzanie uprawnień:');
        console.log('bookingData.createdBy:', bookingData.createdBy);
        console.log('currentUser.uid:', currentUser.uid);
        console.log('isAdmin:', isAdmin);

        if (bookingData.createdBy !== currentUser.uid && !isAdmin) {
          console.log('EditBookingPage - fetchBookingData: Brak uprawnień.');
          setPageError('Nie masz uprawnień do edycji tej rezerwacji.');
          setInitialData(null);
        } else {
          console.log('EditBookingPage - fetchBookingData: Użytkownik ma uprawnienia.');
          const dateObject = bookingData.date.toDate();
          const formattedDate = dateObject.toISOString().split('T')[0];
          const participantsString = (bookingData.participants || []).join(', ');

          setInitialData({ ...bookingData, date: formattedDate, participants: participantsString });
          console.log('EditBookingPage - fetchBookingData: Ustawiono initialData:', { ...bookingData, date: formattedDate, participants: participantsString });

          setValue('title', bookingData.title);
          setValue('description', bookingData.description || '');
          setValue('date', formattedDate);
          setValue('startTime', bookingData.startTime);
          setValue('endTime', bookingData.endTime);
          setValue('participants', participantsString);
          console.log('EditBookingPage - fetchBookingData: Wartości formularza ustawione.');
        }
      } else {
        console.log('EditBookingPage - fetchBookingData: Nie znaleziono rezerwacji.');
        setPageError('Nie znaleziono rezerwacji o podanym ID.');
        setInitialData(null);
      }
    } catch (error) {
      console.error('EditBookingPage - Błąd podczas pobierania danych rezerwacji:', error);
      setPageError('Nie udało się załadować danych rezerwacji.');
      setInitialData(null);
    } finally {
      setLoadingBooking(false);
      console.log('EditBookingPage - fetchBookingData: Zakończono, loadingBooking:', false);
    }
  }, [bookingId, currentUser, isAdmin, setValue, setPageError, setLoadingBooking, setInitialData]); // Dodano wszystkie funkcje ustawiające stan

  useEffect(() => {
    fetchBookingData();
  }, [fetchBookingData]);

  const onSubmit = async (data) => {
    console.log('EditBookingPage - onSubmit: Dane formularza:', data);
    // setPageError(''); // Resetuj błędy strony przed próbą zapisu, jeśli chcesz
    if (!currentUser) {
      showSnackbar('Musisz być zalogowany, aby edytować rezerwację.', 'error');
      return;
    }
    if (!initialData) {
      showSnackbar('Nie można zapisać zmian, dane rezerwacji nie zostały poprawnie załadowane lub nie masz uprawnień.', 'error');
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

    const participantsArray = data.participants
      ? data.participants.split(',').map(email => email.trim()).filter(email => email !== '')
      : [];

    try {
      const bookingRef = doc(db, 'meetings', bookingId);
      const updatedBookingData = {
        title: data.title,
        description: data.description || '',
        date: Timestamp.fromDate(startDateTime),
        startTime: data.startTime,
        endTime: data.endTime,
        participants: participantsArray,
        status: initialData.status,
        updatedAt: serverTimestamp(),
        ...(isAdmin && initialData.createdBy !== currentUser.uid && { lastEditedByAdmin: currentUser.uid })
      };

      await updateDoc(bookingRef, updatedBookingData);
      console.log('EditBookingPage - Rezerwacja zaktualizowana:', bookingId);
      showSnackbar('Rezerwacja została pomyślnie zaktualizowana!', 'success');
      const navigateTo = isAdmin && initialData.createdBy !== currentUser.uid ? '/admin-dashboard' : '/my-bookings';
      navigate(navigateTo);
    } catch (error) {
      console.error('EditBookingPage - Błąd podczas aktualizacji rezerwacji: ', error);
      showSnackbar('Nie udało się zaktualizować rezerwacji. Spróbuj ponownie.', 'error');
    }
  };

  if (loadingBooking) {
    console.log('EditBookingPage - Render: loadingBooking jest true, wyświetlam CircularProgress.');
    return (
      <Container maxWidth="sm" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Jeśli initialData jest null PO załadowaniu, a nie ma błędu z fetch, to prawdopodobnie brak uprawnień
  // lub rezerwacja nie istnieje. pageError powinien być już ustawiony przez fetchBookingData.
  if (!initialData) {
    console.log('EditBookingPage - Render: Brak initialData, wyświetlam błąd lub ostrzeżenie.');
    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
             <Alert severity={pageError ? "error" : "warning"}>
                {pageError || 'Nie można załadować danych rezerwacji lub nie masz uprawnień.'}
             </Alert>
             <Button component={RouterLink} to={isAdmin ? "/admin-dashboard" : "/my-bookings"} startIcon={<ArrowBackIcon />} sx={{mt: 2}}>
                Wróć
            </Button>
        </Container>
    );
  }

  console.log('EditBookingPage - Render: Renderowanie formularza edycji.');
  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton component={RouterLink} to={isAdmin && initialData?.createdBy !== currentUser?.uid ? "/admin-dashboard" : "/my-bookings"} sx={{ mr: 1 }}>
            <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Edytuj Rezerwację {isAdmin && initialData?.createdBy !== currentUser?.uid ? '(Admin)' : ''}
        </Typography>
      </Box>

      {/* Błędy walidacji pól są obsługiwane przez helperText, ogólne błędy operacji przez Snackbar */}
      {/* Można dodać Alert dla pageError, jeśli chcesz wyświetlić błąd ładowania danych nad formularzem */}
      {pageError && !Object.keys(errors).length && (
         <Alert severity="error" sx={{ mb: 2 }}>{pageError}</Alert>
      )}


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
          disabled={isSubmitting || loadingBooking || !initialData}
          sx={{ mt: 3 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Zapisz Zmiany'}
        </Button>
      </Box>
    </Container>
  );
}

export default EditBookingPage;
