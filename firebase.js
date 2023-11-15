import firebase from "firebase/app"

import "firebase/auth"
import "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyDG5c9Diyi5W3tuefA72csagd8LPXxvicU",
    authDomain: "yahtzee-game-bf8b8.firebaseapp.com",
    databaseURL: "https://yahtzee-game-bf8b8-default-rtdb.firebaseio.com",
    projectId: "yahtzee-game-bf8b8",
    storageBucket: "yahtzee-game-bf8b8.appspot.com",
    messagingSenderId: "686029158976",
    appId: "1:686029158976:web:6d4904b462188be94b3da5"
  };

const app = initializeApp(firebaseConfig);
const firebaseAuth = firebase.auth();
const firestore = firebase.firestore()

export { firebaseAuth, firestore }
