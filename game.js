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
const rollCheckRef = ref(database, 'game_state/isRollClicked')
const gameStartedRef = ref(database, `game_state/isGameStarted/isGameStarted`);
const gameStateDiceRef = ref(database, `game_state/dice`);

let currentPlayer;
let rollCount = 0;
let isFirstTurn = true;
let playerDice = [];

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

        rollCount = 0;
        
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
    // Clicking roll button triggers a change in the database
    rollButton.addEventListener("click", () => {
        //TODO: Later, if rollCount < 3 OR if a table selection was not made
            if (rollCount < 3){
                rollCount++;
                console.log("Roll #",rollCount);
                update(gameStateRef, {isRollClicked: true});
                rollDice();
                // let diceArr = createDiceToRoll();
                // playerDice = rollDice(diceArr); 
                //console.log("Player has rolled: ", playerDice);
                
    
            } else {
                console.log("No more rolls left");
            }
    });
}

function rollDice(){
    onValue(rollCheckRef, (snapshot) => {
        update(gameStateRef, {isRollClicked: false});
        if (snapshot.exists() && snapshot.val() === true){
            console.log("Rolling");
            let diceToRoll = createDiceToRoll();
            //console.log(diceToRoll);

            for (let i=0; i<diceToRoll.length; i++){
                let currDice = diceToRoll[i];
                let diceRoll = Math.floor(Math.random()*6)+1;
                playerDice[currDice-1] = diceRoll;
                update(gameStateDiceRef, {
                    [`dice${currDice}/roll`] : diceRoll,
                    [`dice${currDice}/img`] : "dice" + diceRoll + ".png"
                });
            }

            console.log(playerDice);

        }
    });
}

function displayDiceRoll(){
    console.log("In display dice roll");

    // Updates whenever changes in game_state/dice occur
    onValue(gameStateDiceRef, (snapshot) => {
        if (snapshot.val()){
            //console.log(snapshot.val()[dice1]);
            const faceElements = document.querySelectorAll(".face");
            if (faceElements.length > 0){
                faceElements.forEach((diceFace, index) => {
                    const diceKey = `dice${index + 1}`; // Form the key based on index 
                    if (snapshot.val()[diceKey] && snapshot.val()[diceKey].img){
                        let imageUrl = snapshot.val()[diceKey].img; // Access the img property
                        diceFace.setAttribute('src', imageUrl);
                    }
                });
            }
    
        }

    });
}
function createDiceToRoll(){
    console.log("Creating dice to roll");
    /**
     * This function creates an array with the indices of the dice to replace.
     * E.g. If the leftmost and rightmost dice are clicked, function will return array [2 3 4]
     * 
     */
    let diceArr = []
    const clickedDice = document.querySelectorAll(".clickable:not(.clicked)");

    if (clickedDice.length > 0){
        clickedDice.forEach(dice => {
            let diceIndex = dice.id.replace('dice', '');
            diceArr.push(parseInt(diceIndex));
            //console.log(diceIndex)
        });

    } else {
        diceArr = [0,0,0,0,0];
    }

    return diceArr;
}

(function()  {
    // Set current player to first player in playerList
    setCurrentPlayerStartOfGame();
    // Change visibility of roll button when player turn changes
    changeRollButtonVisibility();
    rollButtonListener();
    //rollDice();
    displayDiceRoll();
    // ChangeTurn() should actually be called when the user clicks a row element, but NOT within a click listener
    // But instead via listening to the database. Clicking a row element should update a value in the database
    // Which will be listened to and then changeTurn() will be called.
    onValue(ref(database, 'test'), (snapshot) => {
        console.log("CHANGING TURN MANUALLY ACTIVATED BY USER");
        changeTurn();
    });

})();