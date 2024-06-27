import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCf47sUpEL-GYWgBr9qnAek30RyKkGjtNQ",
  authDomain: "bip-clone.firebaseapp.com",
  projectId: "bip-clone",
  storageBucket: "bip-clone.appspot.com",
  messagingSenderId: "477309780792",
  appId: "1:477309780792:web:31b4b694c71a70e5def7cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getAuth(app);