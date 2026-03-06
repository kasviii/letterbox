import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBuORCfDEYSBSPstIIJUSB30yaLtFyVc7w",
  authDomain: "write-a-note-fdbf7.firebaseapp.com",
  projectId: "write-a-note-fdbf7",
  storageBucket: "write-a-note-fdbf7.firebasestorage.app",
  messagingSenderId: "103658742720",
  appId: "1:103658742720:web:6978f6294dc6e95e5b9e25"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);