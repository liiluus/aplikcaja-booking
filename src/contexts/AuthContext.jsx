// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Upewnij się, że ścieżka jest poprawna
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Przechowuje obiekt użytkownika z Firebase Auth
  const [userData, setUserData] = useState(null); // Przechowuje dodatkowe dane użytkownika z Firestore
  const [loading, setLoading] = useState(true); // Stan ładowania, aby uniknąć migotania UI

  // Funkcja logowania nie jest tu potrzebna, bo logowanie obsługujemy w LoginPage
  // i onAuthStateChanged zajmie się aktualizacją currentUser.
  // Możemy dodać funkcję login, jeśli chcemy opakować logikę signInWithEmailAndPassword
  // i od razu pobrać dane z Firestore, ale na razie uprościmy.

  async function logout() {
    setUserData(null); // Czyść dane użytkownika z Firestore
    return signOut(auth); // Wyloguj z Firebase Auth
  }

  useEffect(() => {
    // Nasłuchuj zmian stanu uwierzytelnienia Firebase
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // Ustawia użytkownika z Firebase Auth (lub null)
      if (user) {
        // Jeśli użytkownik jest zalogowany, pobierz jego dodatkowe dane z Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData({ uid: user.uid, ...userDocSnap.data() });
            console.log("Dane użytkownika z Firestore załadowane:", userDocSnap.data());
          } else {
            console.warn("Nie znaleziono dokumentu użytkownika w Firestore dla UID:", user.uid);
            setUserData(null); // Użytkownik jest w Auth, ale nie ma danych w Firestore
          }
        } catch (error) {
          console.error("Błąd podczas pobierania danych użytkownika z Firestore:", error);
          setUserData(null);
        }
      } else {
        // Jeśli użytkownik jest wylogowany
        setUserData(null);
      }
      
      console.log('AuthContext - Stan przed setLoading(false): user:', !!user, 'userData:', !!userData);
        setLoading(false); // Zakończono sprawdzanie stanu, można pokazać UI
      console.log('AuthContext - setLoading(false) zostało właśnie wywołane.');

      setLoading(false); // Zakończono sprawdzanie stanu, można pokazać UI
    });

    // Funkcja czyszcząca, która odsubskrybuje nasłuchiwanie przy odmontowywaniu komponentu
    return unsubscribe;
  }, []); // Pusta tablica zależności oznacza, że efekt uruchomi się tylko raz (przy montowaniu)

  const value = {
    currentUser, // Obiekt użytkownika z Firebase Auth (zawiera np. email, uid)
    userData,    // Obiekt z dodatkowymi danymi z Firestore (imię, nazwisko, rola)
    isUserLoggedIn: !!currentUser, // Prosty boolean wskazujący, czy użytkownik jest zalogowany
    isAdmin: userData?.role === 'admin', // Sprawdzenie, czy użytkownik jest adminem
    logout,
    loading,     // Stan ładowania
  };

  // Nie renderuj dzieci, dopóki stan ładowania nie zostanie zakończony,
  // aby uniknąć sytuacji, gdzie chronione ścieżki renderują się zbyt wcześnie.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
