import { getDatabase, ref, set, child, get, onValue, onChildAdded, onChildRemoved, onDisconnect, update} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";
import {auth, database, playerList as turnOrder} from "/app.js";
export { startGame }
const rollButton = document.getElementById("rollButton");
const gameContainer = document.getElementById("gameContainer");
const diceContainer = document.getElementById("diceContainer");
const diceElements = document.querySelectorAll(".dice");
let gameStateDiceRef;
let gameStatePlayerTotals;
let playerTurn;


diceElements.forEach(dice => {
    dice.classList.add('clickable');
});
// FIREBASE
//const allPlayersRef = ref(database, 'players');
//const playerCountRef = ref(database, `player_count`);


let roundCount = 0;
let rollCount;
let playerDice;

// start with player list, turn order is player list order
// give player 'turn' attribute when its their turn (true/false) 
// 

function initDice(){
    
    for (let i=0; i<5; i++){
        let gameStateDiceInit = ref(database, `game_state/dice/dice${i+1}`);
        set(gameStateDiceInit, {
            roll : 0,
            img : "dice1.png"
        });

    }

}


function startGame() {
    // Initialize dice

    initDice();
    displayDiceRoll();
    //displayTempScores();
    startTurn();
    
}

function startTurn() {

    // Add indicator on screen as to who's turn it is
    // Only the player in playerId has permission to click 'roll'

    rollCount = 0;
    playerDice = [];

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

    // Listener for roll button
    rollButton.addEventListener("click", () => {
        let diceArr = createDiceToRoll();
        console.log("Dice array: ", diceArr);
        rollDice(diceArr); 
    });


    displayDiceRoll()
}

    function createDiceToRoll(){
        let diceArr = []
        let newDiceIndex = []
        const clickedDice = document.querySelectorAll(".clickable:not(.clicked)");

        if (clickedDice.length > 0){
            clickedDice.forEach(dice => {
                let diceIndex = dice.id.replace('dice', '');
                diceArr.push(parseInt(diceIndex));
                //console.log(diceIndex)
            });

        } else {
            diceArr = [1,2,3,4,5];
        }

        return diceArr;

    }

    function rollDice(diceArr) {
        // diceArr is an array of the indices of the dice to be re-rolled
        gameStateDiceRef = ref(database, `game_state/dice`);
        rollCount++;
        


        // Get 5 random dice from 1-6. Add this roll to the database.
        for (let i=0; i<diceArr.length; i++){
            let currDice = diceArr[i];
            let diceRoll = Math.floor(Math.random()*6)+1;
            playerDice[currDice-1] = diceRoll;
            update(gameStateDiceRef, {[`dice${currDice}/roll`] : diceRoll});
            update(gameStateDiceRef, {[`dice${currDice}/img`] : "dice" + diceRoll + ".png"});
        }

        console.log("Player dice: ", playerDice);
        //calculateOnes(playerDice)
    }

    function displayDiceRoll(){
        gameStateDiceRef = ref(database, `game_state/dice`);

        // Updates whenever changes in game_state/dice occur
        onValue(gameStateDiceRef, (snapshot) => {
            const faceElements = document.querySelectorAll(".face");
            if (faceElements.length > 0){
                faceElements.forEach((diceFace, index) => {
                    const diceKey = `dice${index + 1}`; // Form the key based on index
                    const imageUrl = snapshot.val()[diceKey].img; // Access the img property
                    diceFace.setAttribute('src', imageUrl);
                });
            }

        });
    }



    function calculateOnes(playerDice){
        let score = 0;
        for (let i = 0; i < playerDice.length; i++){
            if (playerDice[i] === 1){
                score+= 1;
            }
        }
        return score;

    }

    function displayTempScores(){
        currentPlayer = turnOrder[0];
        gameStatePlayerTotals = ref(database, `game_state/players/${currentPlayer}`)
        onValue(gameStatePlayerTotals, (snapshot) => {
            const rowElements = document.querySelectorAll('.cell[id*="' + playerId + '"]')
            rowElements.forEach((row, index) => {
                console.log(row);
            });
        });

    }