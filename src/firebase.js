import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwCkuq59JHVbeW4FBbsrEtv3C7oRqos08",
  authDomain: "usm-edonation-3acce.firebaseapp.com",
  databaseURL: "https://usm-edonation-3acce-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "usm-edonation-3acce",
  storageBucket: "usm-edonation-3acce.firebasestorage.app",
  messagingSenderId: "780082933382",
  appId: "1:780082933382:web:02806cfe2bbfd1d12deb07",
  measurementId: "G-K4HPGKTDC7",
};
  
// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
export const auth = getAuth(app);

export default app; // Default export for Firebase app
export { db }; // Named export for Firestore
