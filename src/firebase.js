import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAjQZ1QcG3uzcB1m-hW2zWGrCViqIknaoM",
  authDomain: "jd-good-hair.firebaseapp.com",
  projectId: "jd-good-hair",
  storageBucket: "jd-good-hair.firebasestorage.app",
  messagingSenderId: "906132807042",
  appId: "1:906132807042:web:68ec98e44a515a7c68039b",
  measurementId: "G-MTL0EEFGYR"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
