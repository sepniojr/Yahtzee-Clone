import { getAuth} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js";
import { getDatabase} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyDG5c9Diyi5W3tuefA72csagd8LPXxvicU",
  authDomain: "yahtzee-game-bf8b8.firebaseapp.com",
  databaseURL: "https://yahtzee-game-bf8b8-default-rtdb.firebaseio.com",
  projectId: "yahtzee-game-bf8b8",
  storageBucket: "yahtzee-game-bf8b8.appspot.com",
  messagingSenderId: "686029158976",
  appId: "1:686029158976:web:6d4904b462188be94b3da5"
});

const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);
export {auth, database};