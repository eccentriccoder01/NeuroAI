// src/firebase/config.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // <-- ADD THIS LINE
import { getFirestore } from "firebase/firestore"; // <-- ADD THIS LINE

// Your web app's Firebase configuration
const firebaseConfig = {
  // This is the key that Firebase says is invalid.
  // Double-check it against your Firebase project settings.
  apiKey: "AIzaSyAWaKw5cp_7Z34CUrDJwk5jAzJOBQgQpOQ", 
  authDomain: "neuroai-aihelp.firebaseapp.com",
  projectId: "neuroai-aihelp",
  storageBucket: "neuroai-aihelp.firebasestorage.app",
  messagingSenderId: "522437937079",
  appId: "1:522437937079:web:8f73095bcd881e88554a32",
  measurementId: "G-V63LQ5HFQD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and EXPORT Firebase services for the rest of your app to use
// VITAL: These lines make 'auth' and 'db' available to your login page
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);