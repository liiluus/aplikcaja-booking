// src/pages/CalendarPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; 
import plLocale from '@fullcalendar/core/locales/pl';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper'; 

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
        where('status', '==', 'scheduled')
      );

      const querySnapshot = await getDocs(q);
      const calendarEvents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const bookingDate = data.date.toDate(); 

        const startDateTime = new Date(
          bookingDate.getFullYear(),
          bookingDate.getMonth(),
          bookingDate.getDate(),
          parseInt(data.startTime.split(':')[0], 10), 
          parseInt(data.startTime.split(':')[1], 10) 
        );
        const endDateTime = new Date(
          bookingDate.getFullYear(),
          bookingDate.getMonth(),
          bookingDate.getDate(),
          parseInt(data.endTime.split(':')[0], 10),  
          parseInt(data.endTime.split(':')[1], 10)   
        );

        return {
          id: doc.id,
          title: data.title || 'Spotkanie',
          start: startDateTime,
          end: endDateTime,
          allDay: false,
          extendedProps: {
            bookingData: { id: doc.id, ...data } 
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
      setLoading(false);
    }
  }, [currentUser, fetchBookingsForCalendar]);

  const handleEventClick = (clickInfo) => {
    console.log('Kliknięto wydarzenie:', clickInfo.event);
    const bookingId = clickInfo.event.id; 
    if (bookingId) {
      navigate(`/edit-booking/${bookingId}`);
    }
  };

  const handleDateSelect = (selectInfo) => {
    console.log('Zaznaczono datę/okres:', selectInfo);
    const startDate = selectInfo.startStr.split('T')[0]; 
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

      <Paper elevation={3} sx={{ p: { xs: 1, sm: 2, md: 3 } }}> 
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          eventClick={handleEventClick}
          select={handleDateSelect}
          locales={[plLocale]}
          locale="pl" 
          buttonText={{ 
            today:    'dziś',
            month:    'miesiąc',
            week:     'tydzień',
            day:      'dzień',
            list:     'lista'
          }}
          allDaySlot={false}
          slotMinTime="07:00:00" 
          slotMaxTime="22:00:00" 
          height="auto" 
        />
      </Paper>
    </Container>
  );
}

export default CalendarPage;
