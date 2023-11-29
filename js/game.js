import { auth, database } from "/firebase.js"
import { ref, set, increment, onValue, update, get, onChildAdded} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";
import {playerList, playerCount} from "/app.js";

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
let rowElements;
let rowElementsArr;

const gameStateRef = ref(database, 'game_state');
const gameStateTurnRef = ref(database, `game_state/turn`);
const playerCountRef = ref(database, 'player_count');
const gameRollsRef = ref(database, 'game_state/current_roll');
const rollCheckRef = ref(database, 'game_state/isRollClicked');
const rowClickCheckRef = ref(database, 'game_state/row_click_data');
const bonusCheckRef = ref(database, 'game_state/bonusCheck');
const gameStartedRef = ref(database, `game_state/isGameStarted`);
const gameStateDiceRef = ref(database, `game_state/dice`);
const TABLE_ORDER = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes', 'bonus', 'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smStraight', 'lgStraight', 'yahtzee', 'chance', 'total'];
const bonusCategoryArr = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
let currentPlayer;
let rollCount = 0;
let isFirstTurn = true;
let playerDice = [];
let selectedRowsArr = [];
let currentPlayerScoreRef;
let indexOfCurrentPlayer = 0;
function getPlayerReference(player){
    let playerRef = ref(database, `players/${player}`);
    return playerRef;
}

function resetDice(){
    /**
     * This function clears the dice of it's 'clicked' state afnd resets them visually to 1's
     */
    console.log("Resetting dice...");
    for (let i=0; i<5; i++){
        let gameStateDiceInit = ref(database, `game_state/dice/dice${i+1}`);
        set(gameStateDiceInit, {
            roll : 0,
            img : "../images/dice1.png"
        });
    }
    diceElements.forEach(dice => {
        if (dice.classList.contains('clicked')){
            dice.classList.toggle('clicked');

        }
    });
}

async function changeTurn(){
    /**
     * Function responsible for changing the value of currentPlayer
     */
    resetDice();

    if (!isFirstTurn){
        await displayBonus();
        clearTempScores();
        indexOfCurrentPlayer = playerList.indexOf(currentPlayer);

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
        
        // console.log("Next player's turn: ", currentPlayer);
        
    } else {    
        // console.log("This is the first turn");
        currentPlayer = playerList[0];
        isFirstTurn = false;
    }

    currentPlayerScoreRef = ref(database, `players/${currentPlayer}/score`);
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

function setDataStartOfGame(){
    // Set current player to first player in playerList
    onValue(gameStartedRef, (snapshot) => {
        let isGameStarted = snapshot.val();
        console.log("Starting the game with " + playerCount + " players");
        if (isGameStarted){
            changeTurn()
        }
    });
}

function setRowElements(){
    /**
     * This function adds click listeners to the row cells
     */
    onValue(gameStartedRef, (snapshot) => {

        rowElements = document.querySelectorAll('.clickableCell');
        rowElementsArr = Array.from(rowElements);

        rowElements.forEach(row => {
            row.removeEventListener('click', rowClickHandler);
            row.addEventListener('click', rowClickHandler);
        });
    });
}

function rowClickHandler(event){
    /**
     * This function is called when a row is clicked. Players are only allowed to click on their own rows on their own turn.
     */
    let playerBonusScoreRef = ref(database, `players/${currentPlayer}/score/bonus`);

    if (auth.currentUser.uid === currentPlayer && event.currentTarget.id.includes(currentPlayer) && !selectedRowsArr.includes(event.currentTarget.id) && event.currentTarget.textContent != ''){
        selectedRowsArr.push(event.currentTarget.id);
        update(currentPlayerScoreRef, {
            total: increment(parseInt(event.currentTarget.textContent))
        });
        
        // If the row clicked is one of ones,twos,threes,fours,fives,sixes, add the value to the bonus value
        if (bonusCategoryArr.includes(event.currentTarget.id.replace(currentPlayer, ''))){
            update(currentPlayerScoreRef, {
                bonus: increment(parseInt(event.currentTarget.textContent))
            });
        }

        update(rowClickCheckRef, {
            rowId: event.currentTarget.id,
            rowValue: event.currentTarget.textContent
        });

    } else if (selectedRowsArr.includes(event.currentTarget.id)) {
        console.log("Row has already been selected!");
    } else if (auth.currentUser.uid === currentPlayer && !event.currentTarget.id.includes(currentPlayer)){
        console.log("This isn't your row!");
    } else {
        console.log("It's not your turn!");
    }
} 

function rowClickListener(){
    /**
     * This function triggers when a row is clicked.
     */
    onValue(rowClickCheckRef, (snapshot) => {
        if (snapshot.exists()){
            console.log("ROW IS CLICKED!");
            let rowClicked = snapshot.val().rowId;
            let rowValue = snapshot.val().rowValue;
            let rowLabel = rowClicked.replace(currentPlayer, '')
            let rowObject = rowElementsArr.find(element => element.id === rowClicked)
            
            rowObject.classList.add('clickedRow');

            displayTotalScore();


            update(currentPlayerScoreRef, {[rowLabel] : rowValue});
            changeTurn();
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
    update(gameStateRef, {isRollClicked: true});
    onValue(rollCheckRef, (snapshot) => {
        if (snapshot.exists() && snapshot.val() === true){
            console.log("Rolling");
            let diceToRoll = createDiceToRoll();
            console.log("Dice to roll: ", diceToRoll);
            for (let i=0; i<diceToRoll.length; i++){
                let currDice = diceToRoll[i];
                let diceRoll = Math.floor(Math.random()*6)+1;
                playerDice[currDice-1] = diceRoll;
                update(gameStateDiceRef, {
                    [`dice${currDice}/roll`] : diceRoll,
                    [`dice${currDice}/img`] : "../images/dice" + diceRoll + ".png"
                });
            }

            //console.log(playerDice);
            calculateTempScores(playerDice);
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
    update(gameStateRef, {isRollClicked: false});
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
        });

    } else {
        diceArr = [1,2,3,4,5];
    }

    return diceArr;
}

function calculateTempScores(playerDice){

    update(gameRollsRef, {
        ones: calculateOnes(playerDice),
        twos: calculateTwos(playerDice),
        threes: calculateThrees(playerDice),
        fours: calculateFours(playerDice),
        fives: calculateFives(playerDice),
        sixes: calculateSixes(playerDice),
        threeOfAKind: calculateTOAK(playerDice),
        fourOfAKind: calculateFOAK(playerDice),
        fullHouse: calculateFullHouse(playerDice),
        smStraight: calculateSmStraight(playerDice),
        lgStraight: calculateLgStraight(playerDice),
        yahtzee: calculateYahtzee(playerDice),
        chance: calculateChance(playerDice)
        // chance: calculateChance(playerDice)
    });

}

function displayTempScores(){

    onValue(gameRollsRef, (snapshot) => {
        if (snapshot.val()){
            let currentRoll = snapshot.val();
            const playerRowElements = document.querySelectorAll('.cell[id*="' + currentPlayer + '"]');
            
            const rows = Array.from(playerRowElements);

            for (let i = 0; i < TABLE_ORDER.length; i++){
                if (!rows[i].classList.contains('clickedRow') && !rows[i].classList.contains('unclickableCell')){
                    rows[i].textContent = currentRoll[TABLE_ORDER[i]];
                }
            }

        }
   

    });
}

function displayTotalScore(){
        let totalPlayerElement = document.getElementById('total' + currentPlayer);
        if (totalPlayerElement) {
            // Perform actions with the selected element
            let playerTotalScoreRef = ref(database, `players/${currentPlayer}/score/total`);
            get(playerTotalScoreRef).then((snapshot) => {
                if (snapshot.exists()) {
                    totalPlayerElement.textContent = snapshot.val();
                }
            });
          } else {
            console.log('Element not found.');
          }

        
}

function clearTempScores(){
    const playerRowElements = document.querySelectorAll('.cell[id*="' + currentPlayer + '"]');
    const rows = Array.from(playerRowElements);
    for (let i = 0; i < TABLE_ORDER.length; i++){
        if (!rows[i].classList.contains('clickedRow') && !rows[i].classList.contains('unclickableCell')){
            rows[i].textContent = '';
        }
    }
}

(function()  {
    // Set current player to first player in playerList
    setDataStartOfGame();
    // Change visibility of roll button when player turn changes
    changeRollButtonVisibility();
    rollButtonListener();
    displayTempScores();
    displayDiceRoll();
    setRowElements();
    rowClickListener();


})();

async function displayBonus(){
        let bonusPlayerElement = document.getElementById('bonus' + currentPlayer);
        let bonusReached;
        let currentPlayerScore;

        if (bonusPlayerElement) {
            // Perform actions with the selected element
            console.log("Current player is: ", currentPlayer);
            let playerBonusScoreRef = ref(database, `players/${currentPlayer}/score/bonus`);
            let playerBonusReachedRef = ref(database, `players/${currentPlayer}/bonusReached`);
            await get(playerBonusReachedRef).then((snapshot) => {
                if (snapshot.exists()){
                    bonusReached = snapshot.val();
                }
            });
            
            await get(currentPlayerScoreRef).then((snapshot) => {
                if (snapshot.exists()){
                    currentPlayerScore = snapshot.val().total;
                }
            })

            //FIXME:
            // The bonus gets added to the wrong players score sometimes
            // The bonus gets incremented for each player in the game (figure out how to increment once only)
            await get(playerBonusScoreRef).then((snapshot) => {
                if (snapshot.exists()) {
                    if (snapshot.val() >= 63){
                        console.log(currentPlayer + " has got the bonus!");
                        if (bonusReached === false){
                            currentPlayerScore += 35
                            update(currentPlayerScoreRef, {
                                total: currentPlayerScore
                            });
                        }
                        bonusPlayerElement.textContent = 35;
                        update(getPlayerReference(currentPlayer), {
                            bonusReached: true
                        });
                    }

                }
            });

          } else {
            console.log('Element not found.');
          }
    

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

function calculateTOAK(playerDice){
    let total = 0;
    const count = [];
    for (let i = 0; i<playerDice.length;i++){
        total += playerDice[i];
    }
    for (const i of playerDice){
        count[i] = (count[i] || 0) + 1;
        if (count[i] >= 3){
            console.log(i, count[i]);
            return total;
        } 
    }
    return 0;
}

function calculateFOAK(playerDice){
    let total = 0;
    const count = [];
    for (let i = 0; i<playerDice.length;i++){
        total += playerDice[i];
    }
    for (const i of playerDice){
        count[i] = (count[i] || 0) + 1;
        if (count[i] >= 4){
            console.log(i, count[i]);
            return total;
        } 
    }
    return 0;
}

function calculateFullHouse(playerDice){

    const count = {};
    for (const i of playerDice){
        count[i] = (count[i] || 0) + 1;
    }
    let values = Object.values(count);

    if ((values[0] === 3 && values[1] === 2) || (values[1] === 3 && values[0] === 2)){
        return 25;
    } else {
        return 0;
    }

}

function calculateSmStraight(playerDice){
    let dice = [...new Set(playerDice)];
    let sortedDice = dice.sort();
    let string =  sortedDice.join('');
    if (string.includes('1234') || string.includes('2345') || string.includes('3456')){
        return 30;
    } else {
        return 0;
    }

}

function calculateLgStraight(playerDice){
    let dice = [...new Set(playerDice)];
    let sortedDice = dice.sort();
    let string =  sortedDice.join('');
    if (string.includes('12345') || string.includes('23456')){
        return 40;
    } else {
        return 0;
    }


}

function calculateYahtzee(playerDice){

    if (playerDice.every(dice => dice === playerDice[0])){
        return 50;
    } else {
        return 0;
    }
}

function calculateChance(playerDice){
    let score = 0;
    for (let i=0;i<playerDice.length;i++){
        score += playerDice[i];
    }
    return score;
}