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

function resetDice(){
    console.log("Resetting dice...");
    for (let i=0; i<5; i++){
        let gameStateDiceInit = ref(database, `game_state/dice/dice${i+1}`);
        set(gameStateDiceInit, {
            roll : 0,
            img : "dice1.png"
        });

    }

}


function startGame() {
    // Initialize/reset dice
    console.log("In start game");
    resetDice();

    //displayDiceRoll();
    //displayTempScores();

    startTurn();

}

function startTurn() {
    console.log("In start turn");
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
        //TODO: Later, if rollCount < 4 OR if a table selection was not made
        if (rollCount < 4){
            let diceArr = createDiceToRoll();
            playerDice = rollDice(diceArr); 
            console.log("Player has rolled: ", playerDice);
            rollCount++;
            console.log(rollCount);
            
            
            calculateTempScores(playerDice)
            if (rollCount === 4){
                //Make user select a row
                // End turn
                endTurn();
            }
        } else {
            console.log("Can't roll any more!");
        }

    });

    displayDiceRoll();
    displayTempScores();
    
    
    

}

    function endTurn(){
        // Change who's turn it is
        // Reset dice

        resetDice();
        console.log("Ending turn");
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
            diceArr = [0,0,0,0,0];
        }

        return diceArr;

    }

    function rollDice(diceArr) {
        // diceArr is an array of the indices of the dice to be re-rolled
        gameStateDiceRef = ref(database, `game_state/dice`);
        


        // Get 5 random dice from 1-6. Add this roll to the database.
        for (let i=0; i<diceArr.length; i++){
            let currDice = diceArr[i];
            let diceRoll = Math.floor(Math.random()*6)+1;
            playerDice[currDice-1] = diceRoll;
            update(gameStateDiceRef, {[`dice${currDice}/roll`] : diceRoll});
            update(gameStateDiceRef, {[`dice${currDice}/img`] : "dice" + diceRoll + ".png"});
        }

        return playerDice;
        //calculateOnes(playerDice)
    }

    function displayDiceRoll(){
        console.log("In display dice roll");
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

    function calculateTempScores(playerDice){
        console.log("In displayTempScores", playerDice );
        //TODO: Make currentPlayer change depending on who's turn it is
        let currentPlayer = turnOrder[0];
        gameStatePlayerTotals = ref(database, `game_state/players/${currentPlayer}`)

        update(gameStatePlayerTotals, {
            ones: calculateOnes(playerDice),
            twos: calculateTwos(playerDice),
            threes: calculateThrees(playerDice),
            fours: calculateFours(playerDice),
            fives: calculateFives(playerDice),
            sixes: calculateSixes(playerDice)
        });


    }


    function displayTempScores(){
        let currentPlayer = turnOrder[0];
        gameStatePlayerTotals = ref(database, `game_state/players/${currentPlayer}`)

        onValue(gameStatePlayerTotals, (snapshot) => {
            const rowElements = document.querySelectorAll('.cell[id*="' + currentPlayer + '"]')
            const rows = Array.from(rowElements);

            rows[0].textContent = snapshot.val().ones;
            rows[1].textContent = snapshot.val().twos;
            rows[2].textContent = snapshot.val().threes;
            rows[3].textContent = snapshot.val().fours;
            rows[4].textContent = snapshot.val().fives;
            rows[5].textContent = snapshot.val().sixes;

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
    function calculateTwos(playerDice){
        let score = 0;
        for (let i = 0; i < playerDice.length; i++){
            if (playerDice[i] === 2){
                score+= 2;
            }
        }
        return score;

    }

    function calculateThrees(playerDice){
        let score = 0;
        for (let i = 0; i < playerDice.length; i++){
            if (playerDice[i] === 3){
                score+= 3;
            }
        }
        return score;

    }

    function calculateFours(playerDice){
        let score = 0;
        for (let i = 0; i < playerDice.length; i++){
            if (playerDice[i] === 4){
                score+= 4;
            }
        }
        return score;

    }

    function calculateFives(playerDice){
        let score = 0;
        for (let i = 0; i < playerDice.length; i++){
            if (playerDice[i] === 5){
                score+= 5;
            }
        }
        return score;

    }

    function calculateSixes(playerDice){
        let score = 0;
        for (let i = 0; i < playerDice.length; i++){
            if (playerDice[i] === 6){
                score+= 6;
            }
        }
        return score;

    }