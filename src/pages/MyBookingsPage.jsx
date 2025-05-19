// src/pages/MyBookingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useSnackbar } from '../contexts/SnackbarContext'; 
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert'; 
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import Grid from '@mui/material/Grid';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';

function MyBookingsPage() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(''); 
  const location = useLocation();
  const { showSnackbar } = useSnackbar(); 
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_asc');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setPageError('');
    try {
      const bookingsCollectionRef = collection(db, 'meetings');
      let q = query(
        bookingsCollectionRef,
        where('createdBy', '==', currentUser.uid)
      );

      if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter));
      }

      if (dateFromFilter) {
        try {
          const fromDateObj = new Date(dateFromFilter + "T00:00:00");
          if (isNaN(fromDateObj.valueOf())) throw new Error("Nieprawidłowa data 'od'");
          q = query(q, where('date', '>=', Timestamp.fromDate(fromDateObj)));
        } catch (e) {
          setPageError("Nieprawidłowy format daty 'od'.");
          setBookings([]); setLoading(false); return;
        }
      }

      if (dateToFilter) {
        try {
          const dateToObj = new Date(dateToFilter + "T23:59:59.999");
          if (isNaN(dateToObj.valueOf())) throw new Error("Nieprawidłowa data 'do'");
          q = query(q, where('date', '<=', Timestamp.fromDate(dateToObj)));
        } catch (e) {
          setPageError("Nieprawidłowy format daty 'do'.");
          setBookings([]); setLoading(false); return;
        }
      }

      if (sortBy === 'date_desc') {
        q = query(q, orderBy('date', 'desc'), orderBy('startTime', 'desc'));
      } else if (sortBy === 'createdAt_asc') {
        q = query(q, orderBy('createdAt', 'asc'));
      } else if (sortBy === 'createdAt_desc') {
        q = query(q, orderBy('createdAt', 'desc'));
      } else {
        q = query(q, orderBy('date', 'asc'), orderBy('startTime', 'asc'));
      }

      const querySnapshot = await getDocs(q);
      const userBookings = [];
      querySnapshot.forEach((docSnap) => {
        userBookings.push({ id: docSnap.id, ...docSnap.data() });
      });
      setBookings(userBookings);
    } catch (err) {
      console.error("Błąd podczas pobierania rezerwacji:", err);
      if (err.code === 'failed-precondition') {
        setPageError(
          'Zapytanie wymaga utworzenia dodatkowego indeksu w Firestore. Sprawdź konsolę przeglądarki (szukaj linku do utworzenia indeksu) lub zmień opcje filtrowania/sortowania.'
        );
      } else {
        setPageError('Nie udało się załadować rezerwacji. Spróbuj ponownie później.');
      }
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, statusFilter, sortBy, dateFromFilter, dateToFilter]);

  useEffect(() => {
    if (currentUser) {
      fetchBookings();
    } else {
      setLoading(false);
    }
    
    if (location.state?.message) {
      showSnackbar(location.state.message, 'success');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [currentUser, fetchBookings, location.state, showSnackbar, navigate, location.pathname]);

  const handleOpenCancelDialog = (booking) => {
    setBookingToCancel(booking);
    setOpenCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
    setBookingToCancel(null);
  };

  const handleConfirmCancelBooking = async () => {
    console.log('--- handleConfirmCancelBooking URUCHOMIONA ---');
    console.log('bookingToCancel:', bookingToCancel); 

    if (!bookingToCancel) {
      console.log('handleConfirmCancelBooking: bookingToCancel jest null, przerywam.');
      showSnackbar('Błąd: Brak wybranej rezerwacji do anulowania.', 'error');
      setIsCanceling(false);
      handleCloseCancelDialog();
      return;
    }
    setIsCanceling(true);
    try {
      const bookingRef = doc(db, 'meetings', bookingToCancel.id);
      console.log('handleConfirmCancelBooking: Próba aktualizacji dokumentu:', bookingToCancel.id);
      await updateDoc(bookingRef, {
        status: 'canceled',
        updatedAt: serverTimestamp(),
      });
      console.log('handleConfirmCancelBooking: Rezerwacja anulowana w Firestore:', bookingToCancel.id);
      showSnackbar('Rezerwacja została pomyślnie anulowana.', 'success');
      fetchBookings();
    } catch (err) {
      console.error('handleConfirmCancelBooking: Błąd podczas anulowania rezerwacji:', err);
      showSnackbar('Nie udało się anulować rezerwacji. Spróbuj ponownie.', 'error');
    } finally {
      setIsCanceling(false);
      handleCloseCancelDialog();
      console.log('handleConfirmCancelBooking: Zakończono (finally).');
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setSortBy('date_asc');
    setDateFromFilter('');
    setDateToFilter('');
  };

  if (loading && bookings.length === 0 && !pageError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1" sx={{ mb: { xs: 2, sm: 0 } }}>
          Moje Rezerwacje
        </Typography>
        <Button variant="contained" color="primary" component={RouterLink} to="/new-booking">
          Dodaj Rezerwację
        </Button>
      </Box>

      <Paper elevation={1} sx={{ p: 2, mb: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Filtry i Sortowanie</Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Wszystkie</MenuItem>
                <MenuItem value="scheduled">Zaplanowane</MenuItem>
                <MenuItem value="canceled">Anulowane</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              label="Data od"
              type="date"
              fullWidth
              size="small"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              label="Data do"
              type="date"
              fullWidth
              size="small"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-by-label">Sortuj według</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                label="Sortuj według"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="date_asc">Data spotkania (rosnąco)</MenuItem>
                <MenuItem value="date_desc">Data spotkania (malejąco)</MenuItem>
                <MenuItem value="createdAt_asc">Data utworzenia (rosnąco)</MenuItem>
                <MenuItem value="createdAt_desc">Data utworzenia (malejąco)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1.5} sx={{ textAlign: {xs: 'left', md: 'right'} }}>
            <Button onClick={handleResetFilters} variant="outlined" size="medium">
              Resetuj
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {pageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {pageError}
        </Alert>
      )}

      {!loading && bookings.length === 0 && !pageError && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 5 }}>
          Nie znaleziono rezerwacji pasujących do kryteriów lub nie masz jeszcze żadnych rezerwacji.
        </Typography>
      )}

      {bookings.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {bookings.map((booking) => (
            <Grid item xs={12} sm={6} md={4} key={booking.id}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: booking.status === 'canceled' ? '#f8f8f8' : 'inherit',
                  opacity: booking.status === 'canceled' ? 0.75 : 1,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {booking.title || 'Spotkanie bez tytułu'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Data:</strong>{' '}
                    {booking.date && typeof booking.date.toDate === 'function'
                      ? new Date(booking.date.toDate()).toLocaleDateString()
                      : 'Brak daty'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Godzina:</strong> {booking.startTime || 'N/A'} - {booking.endTime || 'N/A'}
                  </Typography>
                  {booking.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                      <strong>Opis:</strong> {booking.description}
                    </Typography>
                  )}
                  {booking.participants && booking.participants.length > 0 && (
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                      <strong>Uczestnicy:</strong> {booking.participants.join(', ')}
                    </Typography>
                  )}
                  {booking.status === 'canceled' && (
                    <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold', mt: 1.5 }}>
                      STATUS: ANULOWANE
                    </Typography>
                  )}
                  {booking.status === 'scheduled' && (
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mt: 1.5 }}>
                      STATUS: ZAPLANOWANE
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, borderTop: '1px solid #eee' }}>
                  {booking.status !== 'canceled' && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => handleOpenCancelDialog(booking)}
                      disabled={isCanceling && bookingToCancel?.id === booking.id}
                    >
                      {isCanceling && bookingToCancel?.id === booking.id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Anuluj'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    component={RouterLink}
                    to={`/edit-booking/${booking.id}`}
                    disabled={booking.status === 'canceled'}
                    sx={{ ml: 1 }}
                  >
                    Edytuj
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={openCancelDialog}
        onClose={handleCloseCancelDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {'Potwierdź anulowanie rezerwacji'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Czy na pewno chcesz anulować rezerwację:{' '}
            <strong>"{bookingToCancel?.title || 'to spotkanie'}"</strong>? Tej
            operacji nie można cofnąć.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={isCanceling}>
            Nie
          </Button>
          <Button
            onClick={handleConfirmCancelBooking}
            color="error"
            autoFocus
            disabled={isCanceling}
          >
            {isCanceling ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Tak, anuluj'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MyBookingsPage;
