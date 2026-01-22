// Game State
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    playerChoice: null, // Will be 1 or 2
    gameActive: false,
    isPlayerTurn: true
};

// Screen Navigation
function showPlayerSelection() {
    document.getElementById('welcomeScreen').classList.remove('active');
    document.getElementById('playerSelection').classList.add('active');
}

function startGame(playerNumber) {
    gameState.playerChoice = playerNumber;
    gameState.currentPlayer = playerNumber === 1 ? 'X' : 'O';
    gameState.gameActive = true;
    gameState.isPlayerTurn = playerNumber === 1;
    
    document.getElementById('playerSelection').classList.remove('active');
    document.getElementById('gameBoard').classList.add('active');
    
    updateTurnIndicator();
    
    // If player chose O (Player 2), AI makes first move
    if (playerNumber === 2) {
        setTimeout(() => {
            aiMove();
        }, 500);
    }
}

// Update Turn Indicator
function updateTurnIndicator() {
    const indicator = document.getElementById('turnIndicator');
    if (gameState.isPlayerTurn) {
        indicator.textContent = 'Your Turn';
    } else {
        indicator.textContent = 'AI Turn';
    }
}

// Handle Cell Click
function handleCellClick(index) {
    if (!gameState.gameActive || !gameState.isPlayerTurn) {
        return;
    }
    
    if (gameState.board[index] !== '') {
        return;
    }
    
    makeMove(index, gameState.currentPlayer);
    
    if (!checkGameEnd()) {
        gameState.isPlayerTurn = false;
        updateTurnIndicator();
        
        // AI makes move after a short delay
        setTimeout(() => {
            aiMove();
        }, 500);
    }
}

// Make a Move
function makeMove(index, player) {
    gameState.board[index] = player;
    const cell = document.querySelector(`[data-cell="${index}"]`);
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
}

// Check Game End (Win/Draw)
function checkGameEnd() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    // Check for win
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (gameState.board[a] && 
            gameState.board[a] === gameState.board[b] && 
            gameState.board[a] === gameState.board[c]) {
            
            gameState.gameActive = false;
            const winner = gameState.board[a];
            displayGameStatus(winner === gameState.currentPlayer ? 'You Win!' : 'AI Wins!');
            return true;
        }
    }
    
    // Check for draw
    if (!gameState.board.includes('')) {
        gameState.gameActive = false;
        displayGameStatus("It's a Draw!");
        return true;
    }
    
    return false;
}

// Display Game Status
function displayGameStatus(message) {
    document.getElementById('gameStatus').textContent = message;
}

// Reset Game
function resetGame() {
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.gameActive = true;
    gameState.isPlayerTurn = gameState.playerChoice === 1;
    
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });
    
    document.getElementById('gameStatus').textContent = '';
    updateTurnIndicator();
    
    // If player is O, AI moves first
    if (gameState.playerChoice === 2) {
        setTimeout(() => {
            aiMove();
        }, 500);
    }
}

// ========================================
// AI MOVE FUNCTION - INTEGRATE YOUR ANN HERE
// ========================================

fetch('weight.json')
  .then(res => res.json())
  .then(weights => {

    const AI = {
      w1: weights.w1,
      b1: weights.b1,
      w2: weights.w2,
      b2: weights.b2,

      relu: x => Math.max(0, x),
      sigmoid: x => 1 / (1 + Math.exp(-x)),

      predict(boardInput) {
        let z1 = [];
        for (let i = 0; i < 64; i++) {
          let sum = this.b1[i];
          for (let j = 0; j < 9; j++) {
            sum += this.w1[i][j] * boardInput[j];
          }
          z1.push(this.relu(sum));
        }

        let output = [];
        for (let i = 0; i < 9; i++) {
          let sum = this.b2[i];
          for (let j = 0; j < 64; j++) {
            sum += this.w2[i][j] * z1[j];
          }
          output.push(this.sigmoid(sum));
        }
        return output;
      }
    };

    window.AI = AI; // make it accessible to aiMove
    console.log("AI loaded successfully");
  });


console.log("WORKING FINE AND NICE");
function aiMove() {
    if (!gameState.gameActive) return;
    
    // Get AI player symbol
    const aiSymbol = gameState.playerChoice === 1 ? 'O' : 'X';
    const playerSymbol = gameState.playerChoice === 1 ? 'X' : 'O';
    // *** YOUR ANN CODE GOES HERE ***
   const inputBoard = gameState.board.map(cell => {
    if(cell === aiSymbol) return 1;
    if(cell === playerSymbol ) return -1;
    return 0;
   })

   const predictions = AI.predict(inputBoard);

   let bestMoveIndex = -1;
   let bestScore = -Infinity;

   for(let i=0; i<9; i++){
    if(gameState.board[i] === ''){
        if(predictions[i]> bestScore){
            bestScore = predictions[i];
            bestMoveIndex = i;
        }
    }
   }
   
   if (bestMoveIndex === -1){
    // Replace this with your ANN prediction
    console.log("No Best Move");
    const availableMoves = gameState.board
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
    
    console.log("Your available moves are: ", availableMoves)

    bestMoveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    // *** END OF ANN INTEGRATION SECTION ***
   }

    makeMove(bestMoveIndex, aiSymbol);
    
    if (!checkGameEnd()) {
        gameState.isPlayerTurn = true;
        updateTurnIndicator();
    }
}

// ========================================
// HELPER FUNCTIONS FOR ANN INTEGRATION
// ========================================

// Convert board to numerical format for ANN
// Returns array where empty=0, X=1, O=-1 (or customize as needed)
function boardToNumerical() {
    return gameState.board.map(cell => {
        if (cell === '') return 0;
        if (cell === 'X') return 1;
        if (cell === 'O') return -1;
    });
}

// Get all available moves
function getAvailableMoves() {
    return gameState.board
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
}