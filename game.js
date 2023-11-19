import { auth, database } from "/firebase.js"
import { ref, set, child, get, onValue, onChildAdded, onChildRemoved, onDisconnect, update} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";
import {playerList} from "/app.js";

const diceElements = document.querySelectorAll(".dice");
diceElements.forEach(dice => {
    dice.classList.add('clickable');
});
diceElements.forEach(dice => {
    dice.addEventListener('click', function() {
        if (rollCount >= 1){
            // TODO: Make clicked dice visible to other players via firebase
            this.classList.toggle('clicked');
        } else {
            console.log("You can't click this yet!");
        }
    });
});

const rollButton = document.getElementById("rollButton");


const gameStateRef = ref(database, 'game_state');
const gameStateTurnRef = ref(database, `game_state/turn`);
const playerCountRef = ref(database, 'player_count');
const gameRollsRef = ref(database, 'game_state/current_roll');
const gameStartedRef = ref(database, `game_state/isGameStarted/isGameStarted`);
let currentPlayer;
let rollCount;
let isFirstTurn = true;

function getPlayerReference(player){
    let playerRef = ref(database, `players/${player}`);
    return playerRef;
}

function changeTurn(){
    /**
     * Function responsible for changing the value of currentPlayer
     */

    if (!isFirstTurn){
        let indexOfCurrentPlayer = playerList.indexOf(currentPlayer);

        // Change the previous player's turn to false
        update(getPlayerReference(currentPlayer), {turn: false});

        // Select next player in list. If at end of playerList, loop to beginning of list.
        if (indexOfCurrentPlayer + 1 > playerList.length-1) {
            indexOfCurrentPlayer = 0;
        } else {
            indexOfCurrentPlayer += 1;
        }
        currentPlayer = playerList[indexOfCurrentPlayer];

        // Change the next player's turn to true
        update(getPlayerReference(currentPlayer), {turn: true});

        // Update the game state with the ID of the turn player
        // Triggers change in roll button visibility
        update(gameStateRef, {turn: currentPlayer});

        console.log("Next player's turn: ", currentPlayer);
        
    } else {
        currentPlayer = playerList[0];
        isFirstTurn = false;
    }
}

function changeRollButtonVisibility(){
    // Change visibility of roll button when player turn changes
    onValue(gameStateTurnRef, (snapshot) => {
        if (snapshot.exists()){
            console.log("Changing visibility of roll button for ",snapshot.val());
            if (auth.currentUser.uid === snapshot.val()) {
                rollButton.style.display = "block";
            } else {
                rollButton.style.display = "none";
            }
        }
    });
}

function setCurrentPlayerStartOfGame(){
    // Set current player to first player in playerList
    onValue(gameStartedRef, (snapshot) => {
        let isGameStarted = snapshot.val();
        if (isGameStarted){
            currentPlayer = playerList[0];
        }
    });
}

function rollButtonListener(){
    // TODO: Remove listeners when turn change occurs?
    rollButton.addEventListener("click", () => {
        //TODO: Later, if rollCount < 3 OR if a table selection was not made
            if (rollCount < 3){
                rollCount++;
                console.log("Roll #",rollCount);
    
                let diceArr = createDiceToRoll();
                playerDice = rollDice(diceArr); 
                //console.log("Player has rolled: ", playerDice);

    
            } else {
                console.log("No more rolls left");
            }
    });
}

(function()  {
    // Set current player to first player in playerList
    setCurrentPlayerStartOfGame();
    // Change visibility of roll button when player turn changes
    changeRollButtonVisibility();
    
    // ChangeTurn() should actually be called when the user clicks a row element, but NOT within a click listener
    // But instead via listening to the database. Clicking a row element should update a value in the database
    // Which will be listened to and then changeTurn() will be called.
    onValue(ref(database, 'test'), (snapshot) => {
        console.log("CHANGING TURN MANUALLY ACTIVATED BY USER");
        changeTurn();
    });

})();