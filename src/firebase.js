// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvd1zLj0s0yZn34zDSbRFrob59_qnLxCE",
  authDomain: "aplikacja-booking.firebaseapp.com",
  projectId: "aplikacja-booking",
  storageBucket: "aplikacja-booking.firebasestorage.app",
  messagingSenderId: "542603934223",
  appId: "1:542603934223:web:399358a5de3291c3f3817a",
  measurementId: "G-GQS445VJ6N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };