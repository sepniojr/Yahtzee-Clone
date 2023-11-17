import { getDatabase, ref, set, child, get, onValue, onChildAdded, onChildRemoved, onDisconnect, update} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";
import {auth, database, playerList} from "/app.js";
export { startGame }
const rollButton = document.getElementById("rollButton");
const gameContainer = document.getElementById("gameContainer");
const diceContainer = document.getElementById("diceContainer");
const diceElements = document.querySelectorAll(".dice");

// FIREBASE
//const allPlayersRef = ref(database, 'players');
//const playerCountRef = ref(database, `player_count`);


let roundCount = 0;

rollButton.addEventListener("click", rollDice);

diceElements.forEach(dice => {
    dice.addEventListener('click', function() {
        this.classList.toggle('clicked');
        console.log(dice.id, dice.classList.contains('clicked'));
    });
});

// start with player list, turn order is player list order
// give player 'turn' attribute when its their turn (true/false) 
// 
function clickDice() {


}
function startGame() {
    // Dice are only clickable when game has started
}

function startTurn(playerId) {
    // Add indicator on screen as to who's turn it is
    // Only the player in playerId has permission to click 'roll'
    let rollCount = 0;
    
}

function rollDice() {
    let playerDice = [];
    let diceArr = [1, 2, 3, 4, 5];
    const gameStateDiceRef = ref(database, `game_state/dice`);
    // Loop through and update dice

    // Get 5 random dice from 1-6. Add this roll to the database
    for (let i=0; i<diceArr.length; i++){
        let diceRoll = Math.floor(Math.random()*6)+1;
        playerDice.push(diceRoll);
        update(gameStateDiceRef, {[`dice${i + 1}/roll`] : diceRoll});
        update(gameStateDiceRef, {[`dice${i + 1}/img`] : "dice" + diceRoll + ".png"});
    }


    /* 
    FIXME: Player2 doesn't see Player1's updated dice unless they click 'roll' as well. Should have something to do with game 
    starting and making sure everybody is within the rollDice() function
    */ 

    // Set the dice roll data
    console.log(playerDice);
    onValue(gameStateDiceRef, (snapshot) => {
        const faceElements = document.querySelectorAll(".face");
        console.log(snapshot.val());
        faceElements.forEach((diceFace, index) => {
            const diceKey = `dice${index + 1}`; // Form the key based on index
            const imageUrl = snapshot.val()[diceKey].img; // Access the img property
            diceFace.setAttribute('src', imageUrl);
        })
    })
    


    

}