import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js";
import { getDatabase, ref, set, child, get, onValue, onChildAdded, onChildRemoved, onDisconnect, update} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";
import { startGame } from "/game.js"
export { auth, database, playerList}
const firebaseApp = initializeApp({
    apiKey: "AIzaSyDG5c9Diyi5W3tuefA72csagd8LPXxvicU",
    authDomain: "yahtzee-game-bf8b8.firebaseapp.com",
    databaseURL: "https://yahtzee-game-bf8b8-default-rtdb.firebaseio.com",
    projectId: "yahtzee-game-bf8b8",
    storageBucket: "yahtzee-game-bf8b8.appspot.com",
    messagingSenderId: "686029158976",
    appId: "1:686029158976:web:6d4904b462188be94b3da5"
  });

const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);
const allPlayersRef = ref(database, 'players');
const playerCountRef = ref(database, `player_count`);
const gameStartedRef = ref(database, `game_state/isGameStarted`);
const TABLE_ORDER = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes', 'bonus', 'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smStraight', 'lgStraight', 'yahtzee', 'chance', 'total'];
const startGameButton = document.getElementById("startGameButton");
let playerList = [];

function addNewColumn(snapshot) {
    const playerName = snapshot.val().name;
    const playerId = snapshot.val().id;
    const header = document.querySelector('.header');
    const newHeaderCell = document.createElement('div');
    newHeaderCell.classList.add('header-cell')
    newHeaderCell.setAttribute('id', playerId);
    newHeaderCell.textContent = playerName;
    header.appendChild(newHeaderCell);
    const rows = document.querySelectorAll('.row');

    // Loop through each row and add a new cell for the new column
    rows.forEach((row, index) => {
        const newCell = document.createElement('div');
        const newCellId = TABLE_ORDER[index] + playerId;

        newCell.classList.add('cell');
        newCell.setAttribute('id', newCellId);
        newCell.textContent = '';
        row.appendChild(newCell);
    });


}

function removeColumn(snapshot){
    const playerId = snapshot.val().id;

    const headerCell = document.querySelector('.header-cell[id*="' + playerId + '"]');
    headerCell.remove();

    const rows = document.querySelectorAll('.cell[id*="' + playerId + '"]');
    rows.forEach((row) => {
        row.remove();
    });

}

(function () {

    let playerId;
    let playerRef;
    let gameStateRef;
    let playerCount = 0;
                    
    
    startGameButton.addEventListener('click', function() {
        console.log("Starting game");
        update(gameStartedRef, {isGameStarted: true});

        
    });

    function initGame() {
        console.log("In init game");
        
        get(gameStartedRef).then((snapshot) => {
            if (!snapshot.exists()) {
                set(gameStartedRef, {
                    isGameStarted : false
                });
            } else {
                console.log("Error setting up game started reference");
            }
        });

        onValue(gameStartedRef, (snapshot) => {
            if (snapshot.exists()){
                const isGameStarted = snapshot.val().isGameStarted;
                console.log("Is game started? ", isGameStarted);
                if (isGameStarted) {
                    const submitButton = document.getElementById("submitButton");
                    /**
                     * TODO: Find a better way to disable start/submit buttons
                     */
                    submitButton.style.display = 'none';
                    startGameButton.style.display = 'none';
                    startGame();
                } else {
                    update(gameStartedRef, {isGameStarted: false});
                }
            }
        
        });

        onChildAdded(allPlayersRef, (snapshot) => {
            // A new player joins the game

            playerCount++;
            console.log("Player count after join: ", playerCount);
            update(playerCountRef, {count : playerCount});

            playerList.push(snapshot.val().id);
            console.log("Player list after join: ", playerList);

            addNewColumn(snapshot);

        });
        
        onChildRemoved(allPlayersRef, (snapshot) => {
            const removedPlayer = snapshot.val();
            console.log(removedPlayer);
            playerCount--;
            update(playerCountRef, {count : playerCount});

            playerList.splice(playerList.indexOf(removedPlayer.id), 1);

            console.log("Player list after leaving: ", playerList);
            removeColumn(snapshot);

        });

    }

    // If game has started, disable submit

    function playerJoin(event) {
        //event.preventDefault();
        const nameInput = document.getElementById('nameInput');
        const name = nameInput.value;
        
        // Add the player's name to the Firebase Realtime Database
        playerRef = ref(database, `players/${playerId}`);
        get(playerRef).then((snapshot) => {
            if (!snapshot.exists()) {
                console.log(`Adding ${name} to player database`);
                if (playerList.length === 0) {
                    // This player is the host
                    // TODO: Find way to change host when original host leaves the game
                    set(playerRef, {
                        id: playerId,
                        name: name,
                        host: true
                    });
                } else {
                    // Player is not host
                    set(playerRef, {
                        id: playerId,
                        name: name,
                        host: false
                    });
                }
            } else {
                console.log('Problem setting player reference');
            }


        });

        gameStateRef = ref(database, `game_state/players/${playerId}`);
        get(gameStateRef).then((snapshot) => {
            //TODO: Add error checking for all gets
            if (!snapshot.exists()) {
                console.log(`Adding ${name} to game state database`);
                // Player does not exist, so set player data
                set(gameStateRef, {
                    id: playerId,
                    turn: false,
                    ones: 0,
                    twos: 0,
                    threes: 0,
                    fours: 0,
                    fives: 0,
                    sixes: 0,
                    bonuses: 0,
                    threeOfAKind: 0,
                    fourOfAKind: 0,
                    fullHouse: 0,
                    smStraight: 0,
                    lgStraight: 0,
                    yahtzee: 0,
                    chance: 0,
                    total: 0
                });

            } else {
                console.log('Problem setting game state reference');
            }
        });




      }
      
        // Function to trigger onAuthStateChanged
    function checkAuthState() {
        auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.uid);
            playerId = user.uid;
            gameStateRef = ref(database, `game_state/players/${playerId}`);


            initGame();

            window.addEventListener('beforeunload', () => {
                // Remove player from the game on browser/tab close
                if (playerRef) {
                    onDisconnect(playerRef).remove();
                    onDisconnect(gameStateRef).remove();
                    onDisconnect(ref(database, 'player_count')).remove()
                    
                    // TODO: Remove
                    onDisconnect(ref(database, 'game_state')).remove()



                    playerCount--;
                    update(playerCountRef, {count : playerCount});
                }
            });

        } else {
            // User is signed out
            console.log('User is signed out');
            // You can perform actions here after the user signs out
        }
        });
    } 

    
    // Listener for form
    document.addEventListener('DOMContentLoaded', function () {
        const nameForm = document.getElementById('nameForm');

        nameForm.addEventListener('submit', playerJoin);


    
        // Trigger onAuthStateChanged when the page loads
        checkAuthState();
    });


    signInAnonymously(auth).catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;

        console.log(errorCode, errorMessage);
    });




})();
    