// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
// import Typography from '@mui/material/Typography'; // Już niepotrzebne, jeśli usunąłeś wszystkie placeholdery

// Importuj komponenty stron
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyBookingsPage from './pages/MyBookingsPage';
import NewBookingPage from './pages/NewBookingPage'; 
import EditBookingPage from './pages/EditBookingPage';
import CalendarPage from './pages/CalendarPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Importuj Navbar
import Navbar from './layouts/Navbar';
// Importuj ProtectedRoute
import ProtectedRoute from './components/ProtectedRoute';

// Usuń NewBookingPagePlaceholder, jeśli już go nie potrzebujesz
// function NewBookingPagePlaceholder() { ... }

function App() {
  return (
    <Router>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          {/* Ścieżki publiczne */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Ścieżki chronione */}
          <Route element={<ProtectedRoute />}>
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/new-booking" element={<NewBookingPage />} /> 
            <Route path="/edit-booking/:bookingId" element={<EditBookingPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            </Route>
          </Route>
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
