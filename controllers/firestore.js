/**
 * Firestore controller
 *
 * This controller is used to handle all interactions with the Firestore database.
 */
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  query,
  getDocs,
  where,
} = require("firebase/firestore");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_APIKEY,
  authDomain: process.env.FIREBASE_AUTHDOMAIN,
  projectId: process.env.FIREBASE_PROJECTID,
  storageBucket: process.env.FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID,
  appId: process.env.FIREBASE_APPID,
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

const db = getFirestore(firebase);

// Get leaveRequests by user
const getLeaveRequestsByUser = async (user) => {
  // Query leaveRequests collection to find all docs where user = user and status = approved
  const leaveRequestsCollection = collection(db, "leaveRequests");

  const q = query(
    leaveRequestsCollection,
    where("user", "==", user),
    where("status", "==", "approved")
  );

  return getDocs(q);
};

module.exports = { db, getLeaveRequestsByUser };
