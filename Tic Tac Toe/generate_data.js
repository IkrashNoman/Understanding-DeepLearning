//This code is in node js
const fs = require("fs"); 
function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function availableMoves(board) {
  return board.map((v,i) => v === 0 ? i : null).filter(v => v !== null);
}

function bestMove(board, player) {
  const opponent = -player;

  // 1. Win
  for (const i of availableMoves(board)) {
    board[i] = player;
    if (checkWinner(board) === player) {
      board[i] = 0;
      return i;
    }
    board[i] = 0;
  }

  // 2. Block
  for (const i of availableMoves(board)) {
    board[i] = opponent;
    if (checkWinner(board) === opponent) {
      board[i] = 0;
      return i;
    }
    board[i] = 0;
  }

  // 3. Center
  if (board[4] === 0) return 4;

  // 4. Corners
  const corners = [0,2,6,8].filter(i => board[i] === 0);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // 5. Any
  const moves = availableMoves(board);
  return moves[Math.floor(Math.random() * moves.length)];
}

// ===============================
// GENERATE DATA
// ===============================

const dataset = [];
const GAMES = 5000;

for (let g = 0; g < GAMES; g++) {
  let board = Array(9).fill(0);
  let player = 1;

  while (true) {
    const move = bestMove(board, player);
    if (move === undefined) break;

    // Save training example
    const x = [...board];
    const y = Array(9).fill(0);
    y[move] = 1;
    dataset.push({ x, y });

    board[move] = player;

    if (checkWinner(board) || availableMoves(board).length === 0) {
      break;
    }

    player *= -1;
  }
}

console.log(JSON.stringify(dataset));

fs.writeFileSync(
  "data.json",
  JSON.stringify(dataset, null, 2),
  "utf8"
);

console.log("✅ Dataset saved to data.json");