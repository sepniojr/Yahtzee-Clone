import { ref, set, child, get, onValue, onChildAdded, onChildRemoved, onDisconnect, update} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";
import {playerList} from "/app.js";

import { auth, database } from "/firebase.js"
const rollButton = document.getElementById("rollButton");
const gameContainer = document.getElementById("gameContainer");
const diceContainer = document.getElementById("diceContainer");
const diceElements = document.querySelectorAll(".dice");
let rowElements;
let gameStateDiceRef;
let gameStatePlayerTotals;

let indexOfCurrentPlayer;


diceElements.forEach(dice => {
    dice.classList.add('clickable');
});
// FIREBASE
//const allPlayersRef = ref(database, 'players');
//const playerCountRef = ref(database, `player_count`);


let roundCount;
let rollCount;
let playerDice;

// start with player list, turn order is player list order
// give player 'turn' attribute when its their turn (true/false) 
// 

// Game order:
// Start game button pressed
// Set first player's turn
//      
// Set visibility for first player
//      - Visibility field in game_state
// Player can: Roll dice
// 
// Whenever we do something we have to update the value in the database and then do something onValue of that reference


(function() {
    const gameStartedRef = ref(database, `game_state/isGameStarted/isGameStarted`);
    const gameStateTurnRef = ref(database, `game_state/turn`);
    var currentPlayer;

    //TODO: Add 'clicked' value to dice in backend so that other users can see clicked dice
    //TODO: Remove clicked value when turn changes
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

    onValue(gameStartedRef, (snapshot) => {
        if (snapshot.exists()){
        console.log("STARTING GAME");
        // Setting the first player
        currentPlayer = playerList[0];
        console.log("You are: ", auth.currentUser.uid);
        // Initialize/reset dice
        resetDice();

        // Always have clickable elements on the table enabled after first roll. Off of a click event for a row that is when we will trigger things like changing turns
        // Within a click event check if it's the user's turn or not. If yes then perform actions if not then ignore them.
        // In start turn function we check who the current player is and hide all element clickability for people that aren't the current player
        // Alternatively, just enable clickability/visibility for the current player
        startTurn();
        }

    });

    onValue(gameStateTurnRef, (snapshot) => {

        resetDice();

    });


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


    function setVisibility(){
        /**
         * Function adjusts button visibility depending on if it is the player's turn or not
         */
        console.log("Adjusting player visibility");
        //let playerTurnRef = ref(database, `players/${currentPlayer}/turn`);

        if (auth.currentUser.uid === currentPlayer) {
            rollButton.style.display = "block";
        } else {
            rollButton.style.display = "none";
        }

    }

    function rowClickHandler(event){
        console.log("In row click handler");
        //event.target.classList.add('alreadyScored');
        const selectedRow = event.target.id.replace(currentPlayer, '');
        const selectedValue = parseInt(event.target.textContent);
        //console.log(selectedRow, selectedValue);
        const playerScoreRef = ref(database, `game_state/players/${currentPlayer}`);

        update(playerScoreRef, {[selectedRow] : selectedValue});

        changeTurn();
        //startTurn();
    }

    function addRowClickListener(){
        // remove listener when done
            console.log("Adding row listener");
            rowElements.forEach(row => {
                row.addEventListener('click', rowClickHandler);

            });

    }

    function removeRowClickListener(){
        console.log("Removing row listener");
        rowElements.forEach(row => {
            row.removeEventListener('click', rowClickHandler);
        });
    }

    function rollButtonListener(){

        rollButton.addEventListener("click", () => {
            //TODO: Later, if rollCount < 4 OR if a table selection was not made
                if (rollCount < 3){
                    rollCount++;
                    console.log("Roll #",rollCount);

                    let diceArr = createDiceToRoll();
                    playerDice = rollDice(diceArr); 
                    //console.log("Player has rolled: ", playerDice);

                    calculateTempScores(playerDice)

                } else {
                    //endTurn();
                }



        });
    }
    function changeTurn(){
        /**
         * Function responsible for changing the value of currentPlayer
         */

        let playerRef = ref(database, `players/${currentPlayer}`);
        let indexOfCurrentPlayer = playerList.indexOf(currentPlayer);

        // Change the previous player's turn to false
        update(playerRef, {
            turn: false
        });

        // Select next player in list. If at end of playerList, loop to beginning of list.
        if (indexOfCurrentPlayer + 1 > playerList.length-1) {
            console.log("Looping through players again");
            indexOfCurrentPlayer = 0;
        } else {
            indexOfCurrentPlayer += 1;
        }

        currentPlayer = playerList[indexOfCurrentPlayer];

        playerRef = ref(database, `players/${currentPlayer}`);

        // Change the next player's turn to true
        update(playerRef, {
            turn: true
        });

        // Update the game state with the ID of the turn player
        update(gameStateTurnRef, {
            turn: currentPlayer
        });

        console.log("Next player's turn: ", currentPlayer);
        //return currentPlayer;
    }


    function startTurn() {
        rowElements = document.querySelectorAll('.clickableCell');
        setVisibility();
        console.log("In start turn");
        // Add indicator on screen as to who's turn it is
        // Only the player in playerId has permission to click 'roll'

        rollCount = 0;
        playerDice = [];
        removeRowClickListener()
        addRowClickListener()
        rollButtonListener()




        displayDiceRoll();
        displayTempScores();

    }


        function calculateTempScores(playerDice){
            //TODO: Make currentPlayer change depending on who's turn it is
            let getCurrentPlayer = ref(database, `game_state/turn`);
            // Currentplayer is being updated properly
            get(getCurrentPlayer).then((snapshot) => {
                currentPlayer = snapshot.val().turn;
                console.log("CalculateTemp Current player: ", currentPlayer)
            });

            gameStatePlayerTotals = ref(database, `game_state/current_roll`);

            // PROBLEM: When player2 is clicking the button, it is updating player2's database values
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

            gameStatePlayerTotals = ref(database, `game_state/current_roll`);

            // CurrentPlayer is being updated properly which is Why Player1 is seeing the correct columns update
            // However Player2 isnt being updated properly
            onValue(gameStatePlayerTotals, (snapshot) => {

                let getCurrentPlayer = ref(database, `game_state/turn`);
                // Currentplayer is being updated properly
                get(getCurrentPlayer).then((snapshot) => {
                    currentPlayer = snapshot.val().turn;
                    console.log("DisplayTemp Current player: ", currentPlayer)
                }).catch((error) =>{
                    console.log(error);
                });

                console.log("In displayTempScores ", currentPlayer );
                const rowElements = document.querySelectorAll('.cell[id*="' + currentPlayer + '"]')
                console.log(auth.currentUser.uid);
                const rows = Array.from(rowElements);

                rows[0].textContent = snapshot.val().ones;
                rows[1].textContent = snapshot.val().twos;
                rows[2].textContent = snapshot.val().threes;
                rows[3].textContent = snapshot.val().fours;
                rows[4].textContent = snapshot.val().fives;
                rows[5].textContent = snapshot.val().sixes;

            });

        }

})();

function createDiceToRoll(){
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