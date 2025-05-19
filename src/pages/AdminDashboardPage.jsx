// src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Potrzebne do sprawdzenia roli, choć ProtectedRoute to zrobi
import { db } from '../firebase';
import {
  collection,
  query,
  // where, // Usunięto where('createdBy'...)
  getDocs,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Komponenty MUI (skopiuj potrzebne z MyBookingsPage.jsx)
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom'; // Nie potrzebujemy useLocation tutaj
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import Grid from '@mui/material/Grid';
// Filtry i sortowanie można dodać później, na razie uprościmy
// import Select from '@mui/material/Select';
// import MenuItem from '@mui/material/MenuItem';
// import FormControl from '@mui/material/FormControl';
// import InputLabel from '@mui/material/InputLabel';

function AdminDashboardPage() {
  const { currentUser, isAdmin } = useAuth(); // Sprawdzamy isAdmin dla pewności
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Do komunikatów o sukcesie akcji admina

  // Stany dla dialogu anulowania (tak jak w MyBookingsPage)
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const fetchAllBookings = useCallback(async () => {
    // Nie potrzebujemy sprawdzać currentUser tutaj, bo ProtectedRoute to zrobi
    // ale isAdmin może być przydatne do dodatkowych warunków w przyszłości
    setLoading(true);
    setError('');
    try {
      const bookingsCollectionRef = collection(db, 'meetings');
      // Zapytanie pobierające WSZYSTKIE rezerwacje, posortowane po dacie
      let q = query(
        bookingsCollectionRef,
        orderBy('date', 'desc'), // Najnowsze najpierw
        orderBy('startTime', 'desc')
      );

      // Tutaj można dodać logikę filtrów i sortowania dla admina, jeśli potrzebne

      const querySnapshot = await getDocs(q);
      const bookingsData = [];
      querySnapshot.forEach((docSnap) => {
        bookingsData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllBookings(bookingsData);
    } catch (err) {
      console.error("Admin - Błąd podczas pobierania wszystkich rezerwacji:", err);
      // Sprawdź, czy błąd to brak indeksu (może być potrzebny dla sortowania wszystkich)
      if (err.code === 'failed-precondition') {
        setError('Zapytanie wymaga utworzenia dodatkowego indeksu w Firestore dla sortowania wszystkich rezerwacji. Sprawdź konsolę przeglądarki.');
      } else {
        setError('Nie udało się załadować rezerwacji. Spróbuj ponownie później.');
      }
    } finally {
      setLoading(false);
    }
  }, []); // Na razie bez zależności od filtrów admina

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  // Funkcje anulowania i edycji (bardzo podobne do MyBookingsPage)
  // Różnica: admin może anulować/edytować każdą rezerwację
  const handleOpenCancelDialog = (booking) => {
    setBookingToCancel(booking);
    setOpenCancelDialog(true);
  };
  const handleCloseCancelDialog = () => { /* ... (jak w MyBookingsPage) ... */ setOpenCancelDialog(false); setBookingToCancel(null);};
  const handleConfirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    setIsCanceling(true);
    setError('');
    try {
      const bookingRef = doc(db, 'meetings', bookingToCancel.id);
      await updateDoc(bookingRef, {
        status: 'canceled',
        updatedAt: serverTimestamp(),
        lastModifiedByAdmin: currentUser.uid // Opcjonalnie: ślad kto zmodyfikował
      });
      setSuccessMessage(`Rezerwacja "${bookingToCancel.title}" została pomyślnie anulowana.`);
      fetchAllBookings(); // Odśwież listę
    } catch (err) {
      console.error('Admin - Błąd podczas anulowania rezerwacji:', err);
      setError('Nie udało się anulować rezerwacji. Spróbuj ponownie.');
    } finally {
      setIsCanceling(false);
      handleCloseCancelDialog();
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };


  if (loading) {
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
      <Typography variant="h4" component="h1" gutterBottom>
        Panel Administratora - Wszystkie Rezerwacje
      </Typography>

      {successMessage && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {allBookings.length === 0 && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 5 }}>
          Brak rezerwacji w systemie.
        </Typography>
      )}

      {allBookings.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {allBookings.map((booking) => (
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
                  <Typography variant="caption" color="text.secondary" display="block">
                    ID Rezerwacji: {booking.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Utworzone przez (UID): {booking.createdBy}
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
                        'Anuluj (Admin)'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    component={RouterLink}
                    // Admin edytuje przez tę samą stronę, ale strona edycji musi
                    // pozwolić adminowi na edycję (lub stworzyć osobną stronę edycji dla admina)
                    // Na razie linkujemy do standardowej strony edycji.
                    to={`/edit-booking/${booking.id}`}
                    // disabled={booking.status === 'canceled'} // Admin może chcieć edytować nawet anulowane
                    sx={{ ml: 1 }}
                  >
                    Edytuj (Admin)
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {/* Dialog potwierdzenia anulowania (taki sam jak w MyBookingsPage) */}
      <Dialog open={openCancelDialog} onClose={handleCloseCancelDialog}>
        <DialogTitle>{"Potwierdź anulowanie rezerwacji"}</DialogTitle>
        <DialogContent>
            <DialogContentText>
            Czy na pewno chcesz anulować rezerwację: <strong>"{bookingToCancel?.title || 'to spotkanie'}"</strong>?
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseCancelDialog} disabled={isCanceling}>Nie</Button>
            <Button onClick={handleConfirmCancelBooking} color="error" autoFocus disabled={isCanceling}>
                {isCanceling ? <CircularProgress size={20} /> : 'Tak, anuluj'}
            </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminDashboardPage;
