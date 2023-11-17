import { getDatabase, ref, set, child, get, onValue, onChildAdded, onChildRemoved, onDisconnect, update} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";
import {auth, database, playerList} from "/app.js";
export { startGame }
const rollButton = document.getElementById("rollButton");
const gameContainer = document.getElementById("gameContainer");
const diceContainer = document.getElementById("diceContainer");
const diceElements = document.querySelectorAll(".dice");
let gameStateDiceRef;

// FIREBASE
//const allPlayersRef = ref(database, 'players');
//const playerCountRef = ref(database, `player_count`);


let roundCount = 0;
let rollCount;
let playerDice;

// start with player list, turn order is player list order
// give player 'turn' attribute when its their turn (true/false) 
// 



function startGame() {
    // Dice are only clickable when game has started
    gameStateDiceRef = ref(database, `game_state/dice`);

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


    startTurn();
    
}

function startTurn() {
    // Add indicator on screen as to who's turn it is
    // Only the player in playerId has permission to click 'roll'
    rollCount = 0;
;
    // Click dice, create array that contains dice #'s that were clicked i.e. [1, 3, 6] if dice 1 3 6 are clicked
    // Send this array to rollDice()
    
    diceElements.forEach(dice => {

        dice.classList.add('clickable');
        dice.addEventListener('click', function() {
            if (rollCount >= 1){

                this.classList.toggle('clicked');
                //console.log(dice.id, dice.classList.contains('clicked'));
            } else {
                console.log("You can't click this yet!");
            }
        });
    });

    rollButton.addEventListener("click", () => {
        let diceArr = createDiceToRoll();
        console.log("Dice array: ", diceArr);
        rollDice(diceArr); 
    });

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
    playerDice = [];


    // Get 5 random dice from 1-6. Add this roll to the database.
    for (let i=0; i<diceArr.length; i++){
        let currDice = diceArr[i];
        let diceRoll = Math.floor(Math.random()*6)+1;
        playerDice.push(diceRoll);
        update(gameStateDiceRef, {[`dice${currDice}/roll`] : diceRoll});
        update(gameStateDiceRef, {[`dice${currDice}/img`] : "dice" + diceRoll + ".png"});
    }


    /* 
    FIXME: Player2 doesn't see Player1's updated dice unless they click 'roll' as well. Should have something to do with game 
    starting and making sure everybody is within the rollDice() function
    */ 

    // Set the dice roll data
    console.log("Player dice: ", playerDice);
    

}
