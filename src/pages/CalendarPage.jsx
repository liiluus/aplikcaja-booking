// src/pages/CalendarPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Komponenty FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Plugin dla widoku miesiąca, tygodnia, dnia
import timeGridPlugin from '@fullcalendar/timegrid'; // Plugin dla widoków z siatką czasową
import interactionPlugin from '@fullcalendar/interaction'; // Plugin do interakcji (np. klikanie, zaznaczanie)
import plLocale from '@fullcalendar/core/locales/pl';

// Komponenty MUI
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper'; // Do opakowania kalendarza

function CalendarPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchBookingsForCalendar = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const bookingsRef = collection(db, 'meetings');
      const q = query(
        bookingsRef,
        where('createdBy', '==', currentUser.uid),
        where('status', '==', 'scheduled') // Pobieraj tylko zaplanowane rezerwacje
        // orderBy('date', 'asc') // Sortowanie nie jest tu tak krytyczne dla FullCalendar
      );

      const querySnapshot = await getDocs(q);
      const calendarEvents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const bookingDate = data.date.toDate(); // Konwertuj Firebase Timestamp na obiekt Date

        // FullCalendar oczekuje daty rozpoczęcia i zakończenia w formacie ISO lub jako obiekty Date
        // Łączymy datę z Firestore z godziną rozpoczęcia i zakończenia
        const startDateTime = new Date(
          bookingDate.getFullYear(),
          bookingDate.getMonth(),
          bookingDate.getDate(),
          parseInt(data.startTime.split(':')[0], 10), // Godzina
          parseInt(data.startTime.split(':')[1], 10)  // Minuta
        );
        const endDateTime = new Date(
          bookingDate.getFullYear(),
          bookingDate.getMonth(),
          bookingDate.getDate(),
          parseInt(data.endTime.split(':')[0], 10),   // Godzina
          parseInt(data.endTime.split(':')[1], 10)    // Minuta
        );

        return {
          id: doc.id,
          title: data.title || 'Spotkanie',
          start: startDateTime,
          end: endDateTime,
          allDay: false, // Zakładamy, że rezerwacje nie są całodniowe
          // Możesz dodać więcej niestandardowych właściwości do obiektu event
          // np. extendedProps: { description: data.description, participants: data.participants }
          extendedProps: {
             bookingData: { id: doc.id, ...data } // Przekaż całe dane rezerwacji
          }
        };
      });
      setEvents(calendarEvents);
      console.log('Załadowano wydarzenia do kalendarza:', calendarEvents);
    } catch (err) {
      console.error("Błąd podczas ładowania rezerwacji do kalendarza:", err);
      setError('Nie udało się załadować danych do kalendarza.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchBookingsForCalendar();
    } else {
      setLoading(false); // Jeśli nie ma użytkownika, nie ładuj
    }
  }, [currentUser, fetchBookingsForCalendar]);

  const handleEventClick = (clickInfo) => {
    // clickInfo.event to obiekt wydarzenia FullCalendar
    // clickInfo.event.extendedProps.bookingData to nasze oryginalne dane rezerwacji
    console.log('Kliknięto wydarzenie:', clickInfo.event);
    const bookingId = clickInfo.event.id; // lub clickInfo.event.extendedProps.bookingData.id
    if (bookingId) {
      // Przekieruj na stronę edycji tej rezerwacji
      navigate(`/edit-booking/${bookingId}`);
    }
  };

  const handleDateSelect = (selectInfo) => {
     // selectInfo zawiera informacje o zaznaczonym okresie (startStr, endStr, allDay)
     console.log('Zaznaczono datę/okres:', selectInfo);
     // Możesz przekierować na stronę dodawania nowej rezerwacji,
     // przekazując wybraną datę i godzinę jako parametry lub stan
     // np. dla uproszczenia, przekierujmy z datą startową
     const startDate = selectInfo.startStr.split('T')[0]; // Pobierz tylko datę YYYY-MM-DD
     navigate('/new-booking', { state: { preselectedDate: startDate } });
  }


  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Kalendarz Rezerwacji
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: { xs: 1, sm: 2, md: 3 } }}> {/* Dodano padding */}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek" // Domyślny widok (np. tydzień z siatką czasową)
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay' // Dostępne widoki
          }}
          events={events} // Wydarzenia do wyświetlenia
          editable={false} // Czy wydarzenia można przeciągać/zmieniać rozmiar (na razie false)
          selectable={true} // Czy można zaznaczać daty/okresy
          selectMirror={true}
          dayMaxEvents={true} // Ogranicza liczbę wydarzeń na dzień w widoku miesiąca
          weekends={true} // Czy pokazywać weekendy
          eventClick={handleEventClick} // Funkcja wywoływana po kliknięciu wydarzenia
          select={handleDateSelect} // Funkcja wywoływana po zaznaczeniu daty/okresu
          // Możesz dostosować lokalizację, np. język polski
          locales={[plLocale]}
          locale="pl" // Wymaga importu odpowiedniego pliku lokalizacyjnego dla FullCalendar
          buttonText={{ // Polskie nazwy przycisków
             today:    'dziś',
             month:    'miesiąc',
             week:     'tydzień',
             day:      'dzień',
             list:     'lista'
          }}
          allDaySlot={false} // Ukryj slot "cały dzień", jeśli nie używasz
          slotMinTime="07:00:00" // Minimalna godzina wyświetlana w siatce
          slotMaxTime="22:00:00" // Maksymalna godzina
          height="auto" // Dopasuj wysokość do zawartości lub ustaw stałą
        />
      </Paper>
    </Container>
  );
}

export default CalendarPage;
