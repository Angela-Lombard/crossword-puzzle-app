# Micro Matrix

Weekly crossword puzzle game built with React.

## Quick Start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to play.

## How to Play

- Click cells to select words (across/down)
- Click the same cell twice to switch directions at intersections
- Use arrow keys to navigate
- Click "Check Puzzle" to verify answers
- Complete all words to win!

## Customization

Edit the word list in `src/App.js`:

```javascript
const initialWords = [
  { clue: "Your clue", answer: "ANSWER" },
  // Add more words...
];
```

## Build & Deploy

```bash
npm run build
npm run deploy
```
