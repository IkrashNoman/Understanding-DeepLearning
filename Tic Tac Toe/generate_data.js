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
// Crucial: Network always sees "1" as itself and "-1" as opponent.
function normalizeBoard(board, player) {
  return board.map(v => v * player);
}

// ===============================
// METHOD 1: RULE-BASED (bestMove)
// ===============================

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

function generateRuleBasedDataset(games = 5000) {
  const dataset = [];

  for (let g = 0; g < games; g++) {
    let board = Array(9).fill(0);
    let player = 1;

    while (true) {
      const move = bestMove(board, player);
      if (move === undefined) break;

      // FIX APPLIED HERE:
      // Old code: const x = [...board]; (Incorrect - confusing the network)
      // New code: Normalize so the network knows whose turn it is.
      const x = normalizeBoard(board, player);
      
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

  return dataset;
}

// ===============================
// METHOD 2: MINIMAX
// ===============================

function minimax(board, player) {
  const winner = checkWinner(board);
  if (winner === 1) return { score: 1 };
  if (winner === -1) return { score: -1 };
  if (isFull(board)) return { score: 0 };

  let bestMove = null;
  let bestScore = player === 1 ? -Infinity : Infinity;

  for (const move of availableMoves(board)) {
    board[move] = player;
    const result = minimax(board, -player);
    board[move] = 0;

    if (player === 1) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    }
  }

  return { score: bestScore, move: bestMove };
}

function generateMinimaxDataset(games = 2000) {
  const dataset = [];

  for (let g = 0; g < games; g++) {
    let board = Array(9).fill(0);
    let player = 1;

    while (true) {
      const result = minimax(board, player);
      if (result.move === undefined) break;

      const x = normalizeBoard(board, player);
      const y = Array(9).fill(0);
      y[result.move] = 1;

      dataset.push({ x, y });

      board[result.move] = player;

      if (checkWinner(board) || isFull(board)) break;

      player *= -1;
    }
  }

  return dataset;
}

// ===============================
// MAIN
// ===============================

console.log("Generating minmax dataset... this might take a moment.");

//const ruleDataset = generateRuleBasedDataset(5000);
const minimaxDataset = generateMinimaxDataset(12000);

const finalData = {
  ruleBased: [],
  minimax: minimaxDataset
};

fs.writeFileSync("data.json", JSON.stringify(finalData, null, 2), "utf8");

// console.log("✅ Saved both datasets to data.json");
// console.log("Rule-based samples:", ruleDataset.length);
console.log("Minimax samples:", minimaxDataset.length);