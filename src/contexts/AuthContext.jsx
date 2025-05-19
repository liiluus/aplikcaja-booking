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
  const [currentUser, setCurrentUser] = useState(null); 
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true); 

  async function logout() {
    setUserData(null); 
    return signOut(auth); 
  }

  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); 
      if (user) {
        
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData({ uid: user.uid, ...userDocSnap.data() });
            console.log("Dane użytkownika z Firestore załadowane:", userDocSnap.data());
          } else {
            console.warn("Nie znaleziono dokumentu użytkownika w Firestore dla UID:", user.uid);
            setUserData(null); 
          }
        } catch (error) {
          console.error("Błąd podczas pobierania danych użytkownika z Firestore:", error);
          setUserData(null);
        }
      } else {
        
        setUserData(null);
      }
      
      console.log('AuthContext - Stan przed setLoading(false): user:', !!user, 'userData:', !!userData);
        setLoading(false); 
      console.log('AuthContext - setLoading(false) zostało właśnie wywołane.');

      setLoading(false); 
    });

    
    return unsubscribe;
  }, []); 
  const value = {
    currentUser, 
    userData,    
    isUserLoggedIn: !!currentUser, 
    isAdmin: userData?.role === 'admin', 
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
