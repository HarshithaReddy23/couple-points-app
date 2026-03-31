/**
 * Firebase Configuration for Couple Points App
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Click "Create a project" (or use an existing one)
 * 3. Once created, click the Web icon (</>) to add a Web App
 * 4. Register the app with any nickname (e.g. "Couple Points")
 * 5. Copy the firebaseConfig object and paste it below
 * 6. Enable Firestore:
 *    - In Firebase Console, go to Build > Firestore Database
 *    - Click "Create database"
 *    - Choose "Start in test mode" for now
 *    - Select a location closest to you
 * 
 * SECURITY NOTE: For production, update Firestore Security Rules.
 * Test mode rules expire after 30 days.
 */

const firebaseConfig = {
  apiKey: "AIzaSyDTGKK1VtmCinSRzZxioRWmKb5d0wKXsP4",
  authDomain: "harshitha-points.firebaseapp.com",
  projectId: "harshitha-points",
  storageBucket: "harshitha-points.firebasestorage.app",
  messagingSenderId: "769464487998",
  appId: "1:769464487998:web:7ef1ece22cad070884416f",
  measurementId: "G-RJHWK11D31"
};

// Initialize Firebase (compat version for vanilla JS)
firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();
