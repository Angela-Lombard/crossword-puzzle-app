// src/App.js
import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import CrosswordGrid from "./components/CrosswordGrid";
import SuccessModal from "./components/SuccessModal";
import "./App.css";
const crosswordLayoutGenerator = require("crossword-layout-generator");

const initialWords = [
  { clue: "Popular UI library", answer: "react" },
  { clue: "Runtime for JS", answer: "node" },
  { clue: "Cloud platform", answer: "aws" },
  { clue: "Search engine giant", answer: "google" },
  { clue: "Version control site", answer: "github" },
];

function App() {
  const [layout, setLayout] = useState({ result: [], rows: 15, cols: 15 });
  const [userAnswers, setUserAnswers] = useState(
    Array(15)
      .fill(null)
      .map(() => Array(15).fill(""))
  );
  const [activeInfo, setActiveInfo] = useState({
    position: null,
    orientation: "across",
  });
  const [incorrectCells, setIncorrectCells] = useState([]);
  const [isSolved, setIsSolved] = useState(false);

  const generateNewPuzzle = () => {
    const layoutData = crosswordLayoutGenerator.generateLayout(initialWords);
    setLayout(layoutData);
    if (layoutData && layoutData.rows && layoutData.cols) {
      setUserAnswers(
        Array(layoutData.rows)
          .fill(null)
          .map(() => Array(layoutData.cols).fill(""))
      );
    }
    setIsSolved(false);
    setIncorrectCells([]);
    setActiveInfo({ position: null, orientation: "across" });
  };

  useEffect(() => {
    generateNewPuzzle();
  }, []);

  useEffect(() => {
    if (layout.result && layout.result.length > 0) {
      checkAnswers(true); // silent check
    }
  }, [userAnswers, layout.result]);

  const handleCellChange = (x, y, value) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[y][x] = value.toUpperCase();
    setUserAnswers(newUserAnswers);
    // Clear any incorrect marking for this cell when user types
    setIncorrectCells(prev => prev.filter((c) => c.x !== x || c.y !== y));
  };

  const checkAnswers = (isSilent = false) => {
    if (!layout.result) return;
    const incorrect = [];
    let allFilled = true;
    const placedWords = layout.result.filter((w) => w.orientation !== "none");
    placedWords.forEach((word) => {
      for (let i = 0; i < word.answer.length; i++) {
        const x =
          word.orientation === "across" ? word.startx - 1 + i : word.startx - 1;
        const y =
          word.orientation === "down" ? word.starty - 1 + i : word.starty - 1;

        if (!userAnswers[y]?.[x]) {
          allFilled = false;
        } else if (userAnswers[y][x] !== word.answer[i].toUpperCase()) {
          incorrect.push({ x, y });
        }
      }
    });

    const isPuzzleSolved = incorrect.length === 0 && allFilled;

    if (!isSilent) {
      setIncorrectCells(incorrect);
    }

    if (isPuzzleSolved) {
      if (isSilent) {
        setTimeout(() => {
          setIsSolved(true);
        }, 250);
      } else {
        setIsSolved(true);
      }
    }
  };

  const activeClue =
    layout.result &&
    layout.result
      .filter(w => w.orientation !== "none")
      .find(
        (w) =>
          w.position === activeInfo.position &&
          w.orientation === activeInfo.orientation
      );

  return (
    <div className="App">
      {isSolved && <Confetti />}
      {isSolved && <SuccessModal onPlayAgain={generateNewPuzzle} />}
      <h1>🔤 Company Crossword</h1>
      <div className="active-clue">
        {activeClue
          ? `${activeClue.position}. ${
              activeClue.orientation.charAt(0).toUpperCase() +
              activeClue.orientation.slice(1)
            }: ${activeClue.clue}`
          : "Select a cell to see the clue"}
      </div>
      <div className="puzzle-container">
        <CrosswordGrid
          layout={layout}
          onCellChange={handleCellChange}
          userAnswers={userAnswers}
          activeInfo={activeInfo}
          onActiveInfoChange={setActiveInfo}
          incorrectCells={incorrectCells}
        />
        <div className="clues">
          <h2>Clues</h2>
          <ul>
            {layout.result &&
              layout.result
                .filter((w) => w.orientation !== "none")
                .map(({ clue, position, orientation, answer }) => (
                  <li
                    key={`${position}-${orientation}`}
                    className={
                      activeClue &&
                      activeClue.position === position &&
                      activeClue.orientation === orientation
                        ? "active"
                        : ""
                    }
                  >
                    <strong>{`${position}. ${
                      orientation.charAt(0).toUpperCase() +
                      orientation.slice(1)
                    }: `}</strong>
                    {`${clue} (${answer.length})`}
                  </li>
                ))}
          </ul>
        </div>
      </div>
      <button onClick={() => checkAnswers(false)} className="check-button">
        Check Puzzle
      </button>
    </div>
  );
}

export default App;
