# Micro Matrix

A weekly crossword puzzle game, originally built for Ingram Micro Internship Project to spark cross-team connection through company trivia.

[Play Here](https://crossword-puzzle-app-ten.vercel.app)


## How to Play

- Click cells to select words (across/down)
- Click the same cell twice to switch directions at intersections
- Use arrow keys to navigate
- Click "Check Puzzle" to verify answers
- Complete all words to win!


## Tech Stack

- **Frontend:** React 19, react-confetti, deployed as a static build on Vercel
- **Backend:** Express, deployed as a Vercel serverless function (`api/index.js`)
- **Puzzle generation:** `crossword-layout-generator`
- **Data:** better-sqlite3 (leaderboard, currently not surfaced in the UI)
- **Answer validation:** handled server-side — the client never receives the solution, only a sanitized grid shape, so answers can't be read from the browser

## Architecture

The puzzle and its answers are generated once on the server and never sent to the client in solvable form. The frontend fetches a sanitized grid (`GET /api/puzzle`), and every "Check Puzzle" click is validated against the real answers server-side (`POST /api/validate`) — correct/incorrect feedback comes back per-cell. This replaced an earlier version that obfuscated answers client-side (Base64/XOR/Caesar cipher), which was crackable by reading the bundled JS.
