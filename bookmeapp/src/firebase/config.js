// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD1uEnIW3McA711hXhyaHV9CYiFtRESxPg",
  authDomain: "bookmeappweb.firebaseapp.com",
  projectId: "bookmeappweb",
  storageBucket: "bookmeappweb.firebasestorage.app",
  messagingSenderId: "871825213777",
  appId: "1:871825213777:web:5da51b69f07798adcb2b70",
  measurementId: "G-5Y4YWC4SZR"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
// Exporta Auth para usar en la app
export const auth = getAuth(app);
