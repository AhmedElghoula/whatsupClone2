import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDL-c5_NFXx-BltbzDSoWpuSCgChmqJBlc",
  authDomain: "whatsappclone-de297.firebaseapp.com",
  databaseURL: "https://whatsappclone-de297-default-rtdb.firebaseio.com",
  projectId: "whatsappclone-de297",
  storageBucket: "whatsappclone-de297.firebasestorage.app",
  messagingSenderId: "424869572034",
  appId: "1:424869572034:web:4a8f92a10bc255d09aba5b",
  measurementId: "G-EQQS33KTY8",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };

// const firebase = app.initializeApp(firebaseConfig);

// export default firebase;
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fyzftnrrpiljkbclsylf.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5emZ0bnJycGlsamtiY2xzeWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MDgwMDEsImV4cCI6MjA0ODI4NDAwMX0.vsnVMC0kf8CB71mkma2JJwuaDGgFbsVcleccX0lRIUo";
const supabase = createClient(supabaseUrl, supabaseKey);
export { supabase };
