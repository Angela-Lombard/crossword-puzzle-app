const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const crosswordLayoutGenerator = require('crossword-layout-generator');

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: ORIGIN }));

// -------------------- Puzzle Setup (Server-side only answers) --------------------
// Define puzzle words server-side only
const rawPuzzleWords = [
  { clue: 'We share business and five consecutive letters.', answer: 'microsoft' },
  { clue: 'That product? Solid.', answer: 'hardware' },
  { clue: 'Our speediest asset', answer: 'xvantage' },
  { clue: 'Where the Dreamin began. Homeland.', answer: 'california' },
  { clue: 'Minds wander here. We have the solution.', answer: 'cloud' },
  { clue: 'Goods and services giver.', answer: 'vendor' },
  { clue: 'Commander, Bay', answer: 'paul' },
  { clue: 'The name of the mountain we summit?', answer: 'one' },
  { clue: 'Thank you for choosing us, biggest spender.', answer: 'cdw' },
  { clue: 'Neither here nor there on the scale of business.', answer: 'smb' }
];

// Generate layout once for a fixed "puzzleId" (e.g., week1)
const PUZZLE_ID = 'week1';
const layoutWords = rawPuzzleWords.map(({ clue, answer }) => ({ clue, answer }));
const fullLayout = crosswordLayoutGenerator.generateLayout(layoutWords);

// Build an answer grid and a sanitized version for the client
const rows = fullLayout.rows || 15;
const cols = fullLayout.cols || 15;

// Ensure table exists
const fullTable = Array.isArray(fullLayout.table) ? fullLayout.table : Array(rows).fill(null).map(() => Array(cols).fill('-'));

// Answer grid (server-only): uppercase letters and '-'
const answerGrid = fullTable.map(row => row.map(cell => {
  if (!cell || cell === '-') return '-';
  // cell is a letter from layout; normalize to uppercase
  return String(cell).toUpperCase();
}));

// Sanitize table for client (letters replaced with '1', keep '-')
const clientTable = answerGrid.map(row => row.map(cell => (cell === '-' ? '-' : '1')));

// Sanitize result: strip answers but keep metadata and clue
const clientResult = (fullLayout.result || [])
  .filter(w => w.orientation !== 'none')
  .map(w => ({
    position: w.position,
    orientation: w.orientation,
    startx: w.startx,
    starty: w.starty,
    length: (w.answer || '').length,
    clue: rawPuzzleWords.find(r => (r.answer || '').length === (w.answer || '').length && r.clue === w.clue)?.clue || w.clue
  }));

// Helper to validate a provided answers matrix
function validateMatrix(userMatrix) {
  const incorrectCells = [];
  let allFilled = true;
  let allCorrect = true;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const correctChar = answerGrid[y][x];
      if (correctChar === '-') continue; // not part of a word

      const input = (userMatrix?.[y]?.[x] || '').toString().toUpperCase();
      if (!input || input.trim() === '') {
        allFilled = false;
      } else if (input !== correctChar) {
        allCorrect = false;
        incorrectCells.push({ x, y });
      }
    }
  }

  return { allFilled, allCorrect, incorrectCells };
}

// -------------------- DB Setup --------------------
// Vercel serverless functions only allow writes under /tmp, and that storage
// is not persisted between invocations. The leaderboard is currently hidden
// in the UI, so this is fine for now - revisit with a hosted DB (e.g. Turso)
// if/when the leaderboard comes back.
const dbPath = process.env.VERCEL ? path.join('/tmp', 'leaderboard.db') : path.join(__dirname, 'leaderboard.db');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  puzzle_id TEXT NOT NULL,
  display_name TEXT,
  department TEXT,
  time_sec INTEGER NOT NULL,
  points INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scores_puzzle_id ON scores(puzzle_id);
`);

// Simple points formula: start at 1000, subtract 1 per second, min 100
function computePoints(timeSec) {
  const base = 1000;
  const raw = base - Number(timeSec || 0);
  return Math.max(100, raw);
}

// -------------------- Routes --------------------
app.get('/api/puzzle', (req, res) => {
  res.json({
    puzzleId: PUZZLE_ID,
    layout: {
      rows,
      cols,
      table: clientTable,
      result: clientResult
    }
  });
});

app.post('/api/validate', (req, res) => {
  try {
    const { puzzleId, answers } = req.body || {};
    if (puzzleId !== PUZZLE_ID) return res.status(400).json({ error: 'Invalid puzzleId' });

    const { allFilled, allCorrect, incorrectCells } = validateMatrix(answers);
    res.json({ allFilled, allCorrect, incorrectCells });
  } catch (e) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  const stmt = db.prepare(
    'SELECT display_name AS displayName, department, time_sec AS timeSec, points, created_at AS createdAt FROM scores WHERE puzzle_id = ? ORDER BY points DESC, time_sec ASC, created_at ASC LIMIT 50'
  );
  const rows = stmt.all(PUZZLE_ID);
  res.json({ puzzleId: PUZZLE_ID, entries: rows });
});

app.post('/api/submit', (req, res) => {
  try {
    const { puzzleId, answers, displayName, department, timeSec } = req.body || {};
    if (puzzleId !== PUZZLE_ID) return res.status(400).json({ error: 'Invalid puzzleId' });

    const { allFilled, allCorrect } = validateMatrix(answers);
    if (!allFilled || !allCorrect) {
      return res.status(400).json({ error: 'Puzzle is not fully correct' });
    }

    const points = computePoints(timeSec);
    const insert = db.prepare(
      'INSERT INTO scores (puzzle_id, display_name, department, time_sec, points) VALUES (?, ?, ?, ?, ?)'
    );
    insert.run(PUZZLE_ID, displayName || null, department || null, Number(timeSec || 0), points);

    const leaderboard = db.prepare(
      'SELECT display_name AS displayName, department, time_sec AS timeSec, points, created_at AS createdAt FROM scores WHERE puzzle_id = ? ORDER BY points DESC, time_sec ASC, created_at ASC LIMIT 50'
    ).all(PUZZLE_ID);

    res.json({ success: true, points, leaderboard });
  } catch (e) {
    res.status(500).json({ error: 'Submit failed' });
  }
});

// Only start a listening server outside of Vercel (local dev via `node api/index.js`).
// On Vercel, the exported app is invoked directly as the request handler.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
