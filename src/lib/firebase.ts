import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0642343561",
  appId: "1:1066226974286:web:8767de99c1a3869a398d1f",
  apiKey: "AIzaSyAL2kF7vmQdZKEThDDCEoqd-dMmtRjVitE",
  authDomain: "gen-lang-client-0642343561.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-1e9d7ae9-9b88-42b8-a9a9-b8336b6f68c8",
  storageBucket: "gen-lang-client-0642343561.firebasestorage.app",
  messagingSenderId: "1066226974286"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
