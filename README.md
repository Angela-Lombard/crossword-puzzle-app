# Crossword Puzzle App

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Angela-Lombard/crossword-puzzle-app.git
cd crossword-puzzle-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Click on any white cell in the crossword grid to select a word
2. Type letters to fill in your answers
3. Use arrow keys to navigate between cells
4. Click the same cell twice to switch between across and down words at intersections
5. Click "Check Puzzle" to verify your answers
6. Incorrect letters will be marked with a red strikethrough
7. Complete the puzzle to see the celebration animation

## Customization

### Adding New Words

Edit the `initialWords` array in `src/App.js`:

```javascript
const initialWords = [
  { clue: "Your clue here", answer: "YOURANSWER" },
  // Add more words...
];
```

### Styling

The app uses inline styles for reliability, but you can modify the styling in:
- `src/components/CrosswordGrid.js` for grid appearance
- `src/App.css` for general layout
- `src/components/SuccessModal.css` for the completion modal

## Technical Details

### Dependencies

- **React**: Frontend framework
- **crossword-layout-generator**: Automatic crossword layout generation
- **react-confetti**: Celebration animation effects

### Project Structure

```
src/
├── components/
│   ├── CrosswordGrid.js       # Main crossword grid component
│   ├── CrosswordGrid.css      # Grid styling
│   ├── SuccessModal.js        # Completion modal
│   └── SuccessModal.css       # Modal styling
├── utils/
│   └── generatePuzzle.js      # Puzzle generation utilities
├── App.js                     # Main application component
├── App.css                    # Application styling
└── index.js                   # React entry point
