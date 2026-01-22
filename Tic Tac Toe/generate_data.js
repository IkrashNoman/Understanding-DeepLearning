const fs = require("fs");

// ===============================
// UTILS
// ===============================

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkWinner(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isFull(board) {
  return board.every(v => v !== 0);
}

function availableMoves(board) {
  return board
    .map((v, i) => v === 0 ? i : null)
    .filter(v => v !== null);
}

// ===============================
// HELPER: NORMALIZATION
// ===============================
function normalizeBoard(board, player) {
  return board.map(v => v * player);
}

// ===============================
// OPTIMIZED MINIMAX (With Memoization)
// ===============================

// Global Cache for Minimax
const memo = new Map();

function minimax(board, player) {
  // Create a unique key for this board state
  const key = board.toString() + player;
  if (memo.has(key)) return memo.get(key);

  const winner = checkWinner(board);
  if (winner === player) return { score: 10 };
  if (winner === -player) return { score: -10 };
  if (isFull(board)) return { score: 0 };

  let bestMove = null;
  let bestScore = -Infinity;

  const moves = availableMoves(board);

  for (const move of moves) {
    board[move] = player;
    
    const result = minimax(board, -player);
    
    board[move] = 0; 

    const score = -result.score; 

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  const result = { score: bestScore, move: bestMove };
  memo.set(key, result); // Save result to cache
  return result;
}

function generateMinimaxDataset(samples = 15000) {
  const dataset = [];
  const uniqueHashes = new Set();
  
  // Clear cache before starting
  memo.clear();

  console.log(`Generating ${samples} robust samples...`);

  let attempts = 0;
  
  while (dataset.length < samples) {
    attempts++;
    
    // Safety Break
    if (attempts > samples * 5) {
        console.log("Max attempts reached. Stopping.");
        break;
    }

    let board = Array(9).fill(0);
    let player = 1;

    // 1. Create a "Random Messy State"
    const randomMovesCount = Math.floor(Math.random() * 9);
    let validState = true;

    for (let i = 0; i < randomMovesCount; i++) {
      const moves = availableMoves(board);
      if (moves.length === 0 || checkWinner(board)) {
        validState = false; 
        break;
      }
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      board[randomMove] = player;
      player *= -1; 
    }

    if (!validState) continue;

    // 2. Ask Minimax (Now Instant thanks to Cache)
    const result = minimax(board, player);

    if (result.move === null) continue;

    // 3. Normalize & Save
    const x = normalizeBoard(board, player);
    const y = Array(9).fill(0);
    y[result.move] = 1;

    const hash = x.toString() + player; 
    if (!uniqueHashes.has(hash)) {
       uniqueHashes.add(hash);
       dataset.push({ x, y });
       
       // Progress Log
       if (dataset.length % 1000 === 0) {
           console.log(`Generated ${dataset.length}/${samples} samples...`);
       }
    }
  }

  return dataset;
}

// ===============================
// MAIN
// ===============================

console.log("Generating minmax dataset...");

const minimaxDataset = generateMinimaxDataset(100000); // 10k is plenty for Tic-Tac-Toe

const finalData = {
  ruleBased: [],
  minimax: minimaxDataset
};

fs.writeFileSync("data.json", JSON.stringify(finalData, null, 2), "utf8");

console.log("✅ Done! Minimax samples:", minimaxDataset.length);