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

function normalizeBoard(board, player) {
  return board.map(v => v * player);
}

// ===============================
// LOGIC: RULE-BASED
// ===============================

function getRuleBasedMove(board, player) {
  const moves = availableMoves(board);
  if (moves.length === 0) return null;

  // 1. WIN
  for (let move of moves) {
    board[move] = player;
    if (checkWinner(board) === player) {
      board[move] = 0;
      return move;
    }
    board[move] = 0;
  }

  // 2. BLOCK
  const opponent = -player;
  for (let move of moves) {
    board[move] = opponent;
    if (checkWinner(board) === opponent) {
      board[move] = 0;
      return move;
    }
    board[move] = 0;
  }

  // 3. CENTER
  if (board[4] === 0) return 4;

  // 4. RANDOM CORNER
  const corners = [0, 2, 6, 8].filter(i => board[i] === 0);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5. RANDOM SIDE
  return moves[Math.floor(Math.random() * moves.length)];
}

function generateRuleBasedDataset(samples) {
  const dataset = [];
  console.log(`Generating ${samples} Rule-Based samples (Allowing Duplicates)...`);

  // Loop strictly until we hit the count
  while (dataset.length < samples) {
    let board = Array(9).fill(0);
    let player = 1;

    // Create Random State
    const randomMovesCount = Math.floor(Math.random() * 8); 
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

    if (!validState || checkWinner(board) || isFull(board)) continue;

    // Get Move
    const bestMove = getRuleBasedMove(board, player);
    if (bestMove === null) continue;

    // Save WITHOUT checking uniqueness
    const x = normalizeBoard(board, player);
    const y = Array(9).fill(0);
    y[bestMove] = 1;

    dataset.push({ x, y });

    if (dataset.length % 5000 === 0) process.stdout.write(`R: ${dataset.length} `);
  }
  console.log("\nRule-Based Done.");
  return dataset;
}

// ===============================
// LOGIC: MINIMAX
// ===============================

const memo = new Map();

function minimax(board, player) {
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
  memo.set(key, result);
  return result;
}

function generateMinimaxDataset(samples) {
  const dataset = [];
  memo.clear();
  console.log(`Generating ${samples} Minimax samples (Allowing Duplicates)...`);

  while (dataset.length < samples) {
    let board = Array(9).fill(0);
    let player = 1;

    // Create Random State
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

    const result = minimax(board, player);
    if (result.move === null) continue;

    const x = normalizeBoard(board, player);
    const y = Array(9).fill(0);
    y[result.move] = 1;

    // Save WITHOUT checking uniqueness
    dataset.push({ x, y });

    if (dataset.length % 5000 === 0) process.stdout.write(`M: ${dataset.length} `);
  }
  console.log("\nMinimax Done.");
  return dataset;
}

// ===============================
// MAIN
// ===============================

const TARGET_SAMPLES = 50000;

console.log(`Starting Brutal Generation: ${TARGET_SAMPLES} samples per method.`);

// 1. Generate Rule Based
const ruleData = generateRuleBasedDataset(TARGET_SAMPLES);

// 2. Generate Minimax
const minimaxData = generateMinimaxDataset(TARGET_SAMPLES);

const finalData = {
  ruleBased: ruleData,
  minimax: minimaxData
};

fs.writeFileSync("data.json", JSON.stringify(finalData, null, 2), "utf8");

console.log(`\n✅Generated ${minimaxData.length + ruleData.length} total samples.`);