import { getDatabase, ref, set, child, get, onValue, onChildAdded, onChildRemoved, onDisconnect, update} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";
import {auth, database, playerList} from "/app.js";

const rollButton = document.getElementById("rollButton");
const gameContainer = document.getElementById("gameContainer");
const diceContainer = document.getElementById("diceContainer");
const diceElements = document.querySelectorAll(".dice");

// FIREBASE
const allPlayersRef = ref(database, 'players');
const playerCountRef = ref(database, `player_count`);

let roundCount = 0;

//Rollcount has max of 3
let rollCount = 0;

rollButton.addEventListener("click", rollDice);

diceElements.forEach(dice => {
    dice.addEventListener('click', function() {
        this.classList.toggle('clicked');

    });
});

function clickDice() {


}


function rollDice() {
    console.log("click");
    let playerDice = [];
    let diceArr = [1, 2, 3, 4, 5];

    // Get 5 random dice from 1-6
    for (let i=0; i<diceArr.length; i++){
        playerDice.push(Math.floor(Math.random()*6)+1);
    }

    console.log(playerDice);
    console.log(playerList);

    function changeFace(){
        const faceElements = document.querySelectorAll(".face");



    }

}