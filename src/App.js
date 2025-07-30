import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import CrosswordGrid from "./components/CrosswordGrid";
import SuccessModal from "./components/SuccessModal";
import FailureModal from "./components/FailureModal";
import Leaderboard from "./components/Leaderboard";
import "./App.css";
import microMatrixSvg from "./assets/microMatrix.svg";
import homeSvg from "./assets/Home.svg";
import pauseSvg from "./assets/Pause.svg";
import { 
  createObfuscatedPuzzle, 
  decodeMultiLayer, 
  validateAnswer, 
  addAntiDebugProtection 
} from "./utils/puzzleSecurity";

// Console protection
(() => {
  const blocked = ['microsoft', 'hardware', 'xvantage', 'california', 'cloud', 'vendor', 'paul', 'one', 'cdw', 'smb', 'answer', 'solution', 'clue', 'puzzle', 'crossword', 'layout', 'word', 'across', 'down', 'business', 'solid', 'speediest', 'dreamin', 'homeland', 'minds', 'wander', 'goods', 'services', 'commander', 'bay', 'mountain', 'summit', 'choosing', 'biggest', 'spender', 'neither', 'scale'];
  
  const filter = function(orig, ...args) {
    const str = args.join(' ').toLowerCase();
    if (blocked.some(term => str.includes(term)) || 
        /\d+\.\d{10,}/.test(str) ||
        args.some(arg => typeof arg === 'object' && arg !== null)) {
      return;
    }
    orig.apply(console, args);
  };
  
  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;
  const origInfo = console.info;
  
  console.log = (...args) => filter(origLog, ...args);
  console.error = (...args) => filter(origError, ...args);
  console.warn = (...args) => filter(origWarn, ...args);
  console.info = (...args) => filter(origInfo, ...args);
  
  Object.defineProperty(console, 'log', { writable: false, configurable: false });
  Object.defineProperty(console, 'error', { writable: false, configurable: false });
  Object.defineProperty(console, 'warn', { writable: false, configurable: false });
  Object.defineProperty(console, 'info', { writable: false, configurable: false });
})();

const crosswordLayoutGenerator = require("crossword-layout-generator");

const rawPuzzleWords = [
    { clue: "We share business and five consecutive letters.", answer: "microsoft" },
    { clue: "That product? Solid.", answer: "hardware" },
    { clue: "Our speediest asset", answer: "xvantage" },
    { clue: "Where the Dreamin began. Homeland.", answer: "california" },
    { clue: "Minds wander here. We have the solution.", answer: "cloud" },
    { clue: "Goods and services giver.", answer: "vendor" },
    { clue: "Commander, Bay", answer: "paul" },
    { clue: "The name of the mountain we summit?", answer: "one" },
    { clue: "Thank you for choosing us, biggest spender.", answer: "cdw" },
    { clue: "Neither here nor there on the scale of business.", answer: "smb" }
];

const puzzleData = createObfuscatedPuzzle(rawPuzzleWords);
rawPuzzleWords.length = 0;

const getLayoutWords = () => {
  return puzzleData.map(word => ({
    clue: word.clue,
    answer: decodeMultiLayer(word.encodedAnswer)
  }));
};

function App() {
  const [currentScreen, setCurrentScreen] = useState("home");
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('crosswordStreak');
    return saved ? parseInt(saved) : 0;
  });
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
  
  // Timer states
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [completedPuzzleState, setCompletedPuzzleState] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  useEffect(() => {
    let interval = null;
    if (!isPaused && !isSolved && currentScreen === "game") {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (isPaused) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPaused, isSolved, currentScreen]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleHome = () => {
    setCurrentScreen("home");
    setTime(0);
    setIsPaused(false);
    setIncorrectCells([]);
  };

  const startGame = () => {
    generateNewPuzzle();
    setCurrentScreen("game");
    setTime(0);
    setIsPaused(false);
    setIncorrectCells([]);
    setShowFailureModal(false);
  };

  const generateNewPuzzle = () => {
    const layoutWords = getLayoutWords();
    const layoutData = crosswordLayoutGenerator.generateLayout(layoutWords);
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
    
    if (layoutData && layoutData.result) {
      const placedWords = layoutData.result.filter(w => w.orientation !== "none");
      if (placedWords.length > 0) {
        const firstClue = placedWords.reduce((min, word) => 
          word.position < min.position ? word : min
        );
        setActiveInfo({ 
          position: firstClue.position, 
          orientation: firstClue.orientation 
        });
      } else {
        setActiveInfo({ position: null, orientation: "across" });
      }
    } else {
      setActiveInfo({ position: null, orientation: "across" });
    }
  };

  const startNewGame = () => {
    generateNewPuzzle();
    setCurrentScreen("game");
    setTime(0);
    setIsPaused(false);
    setShowSuccessModal(false);
    setShowFailureModal(false);
    setIncorrectCells([]);
  };

  const goToMainMenu = () => {
    setCurrentScreen("home");
    setTime(0);
    setIsPaused(false);
    setIsSolved(false);
    setShowSuccessModal(false);
    setShowFailureModal(false);
    setCompletedPuzzleState(null); // Clear completed puzzle state
    setIncorrectCells([]);
  };

  const goToCompletedPuzzle = () => {
    if (completedPuzzleState) {
      // Restore the completed puzzle state
      setLayout(completedPuzzleState.layout);
      setUserAnswers(completedPuzzleState.userAnswers);
      setTime(completedPuzzleState.time);
      setStreak(completedPuzzleState.streak);
      setIsSolved(true);
      setShowSuccessModal(false); 
      setShowFailureModal(false);// Don't show modal when returning from leaderboard
      setCurrentScreen("game");
      
      // Restore the active clue state, or set first clue as fallback
      if (completedPuzzleState.activeInfo && completedPuzzleState.activeInfo.position) {
        setActiveInfo(completedPuzzleState.activeInfo);
      } else if (completedPuzzleState.layout && completedPuzzleState.layout.result) {
        const placedWords = completedPuzzleState.layout.result.filter(w => w.orientation !== "none");
        if (placedWords.length > 0) {
          const firstClue = placedWords.reduce((min, word) => 
            word.position < min.position ? word : min
          );
          setActiveInfo({ 
            position: firstClue.position, 
            orientation: firstClue.orientation 
          });
        }
      }
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };
  
  const closeFailureModal = () => {
    setShowFailureModal(false);
  }

  const goToLeaderboard = () => {
    // If coming from a solved puzzle, preserve the state
    if (isSolved) {
      setCompletedPuzzleState({
        layout: layout,
        userAnswers: userAnswers,
        time: time,
        streak: streak,
        activeInfo: activeInfo
      });
    }
    setCurrentScreen("leaderboard");
  };

  useEffect(() => {
    generateNewPuzzle();
    addAntiDebugProtection();
  }, []);

  useEffect(() => {
    if (layout.result && layout.result.length > 0) {
      checkForCompletion();
    }
  }, [userAnswers, layout.result]);

  // Check if puzzle is completed (for automatic success detection)
const checkForCompletion = () => {
  if (!layout?.result) {
    setShowFailureModal(true);
    return;
  }

  let allFilled = true;
  let allCorrect = true;
  const placedWords = layout.result.filter((w) => w.orientation !== "none");

  placedWords.forEach((word) => {
    for (let i = 0; i < word.answer.length; i++) {
      const x = word.orientation === "across" ? word.startx - 1 + i : word.startx - 1;
      const y = word.orientation === "down" ? word.starty - 1 + i : word.starty - 1;

      const userInput = userAnswers?.[y]?.[x];
      const correctLetter = word.answer[i].toUpperCase();

      if (!userInput || userInput.trim() === "") {
        allFilled = false;
      } else if (userInput.toUpperCase() !== correctLetter) {
        allCorrect = false;
      }
    }
  });

  if (allFilled && allCorrect) {
    setIsSolved(true);
    setShowSuccessModal(true);
    setShowFailureModal(false);
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('crosswordStreak', newStreak.toString());
  } else if (allFilled &&!allCorrect) {
    setShowFailureModal(true);
  }
};


  const handleCellChange = (x, y, value) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[y][x] = value.toUpperCase();
    setUserAnswers(newUserAnswers);
    // Clear incorrect marking for this cell when user types
    setIncorrectCells(prev => prev.filter((c) => c.x !== x || c.y !== y));
  };

  // Enhanced answer checking with secure validation
  const checkAnswers = () => {
    if (!layout.result) return;
    const incorrect = [];
    const placedWords = layout.result.filter((w) => w.orientation !== "none");
    
    placedWords.forEach((word) => {
      // Check each cell in this word
      for (let i = 0; i < word.answer.length; i++) {
        const x = word.orientation === "across" ? word.startx - 1 + i : word.startx - 1;
        const y = word.orientation === "down" ? word.starty - 1 + i : word.starty - 1;
        
        const userInput = userAnswers[y]?.[x];
        const correctLetter = word.answer[i].toUpperCase();
        
        // Only mark as incorrect if user has input and it's wrong
        if (userInput && userInput.toUpperCase() !== correctLetter) {
          incorrect.push({ x, y });
        }
      }
    });

    // Set incorrect cells for red highlighting
    setIncorrectCells(incorrect);
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

  if (currentScreen === "home") {
    return (
      <div className="App home-screen">
        <div className="home-content">
          <div className="home-logo-container">
            <img src={microMatrixSvg} alt="micro matrix" className="home-logo" />
          </div>
          <div className="home-buttons">
            <button onClick={startGame} className="home-btn play-btn">
              play
            </button>
            <button onClick={goToLeaderboard} className="home-btn leaderboard-btn">
              leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === "leaderboard") {
    return (
      <div className="App leaderboard-screen">
        <div className="header">
          <div className="logo-container" onClick={handleHome} style={{ cursor: 'pointer' }}>
            <img src={microMatrixSvg} alt="micro matrix" className="logo-img" />
          </div>
          <div className="game-info centered">Week 1: Ingram Micro Kickoff</div>
          <div className="header-controls">
            <div className="timer">{formatTime(time)}</div>
            <button className="control-btn pause-btn" onClick={togglePause}>
              <img src={pauseSvg} alt="pause" />
            </button>
            <button className="control-btn home-btn" onClick={handleHome}>
              <img src={homeSvg} alt="home" />
            </button>
          </div>
        </div>
        <Leaderboard 
          onBackToHome={goToMainMenu} 
          onBackToPuzzle={completedPuzzleState ? goToCompletedPuzzle : null}
          hasCompletedPuzzle={!!completedPuzzleState}
        />
      </div>
    );
  }

  return (
    <div className="App game-screen">
      {isSolved && <Confetti />}
      {showSuccessModal && (
        <SuccessModal 
          onPlayAgain={startNewGame} 
          onMainMenu={goToMainMenu}
          onLeaderboard={goToLeaderboard}
          onClose={closeSuccessModal}
        />
      )}

      {showFailureModal && (
        <FailureModal 
        onClose={closeFailureModal} 
        />
      )}

      
      {/* Pause Overlay */}
      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-modal">
            <h2>Game paused</h2>
            <button className="resume-btn" onClick={togglePause}>
              resume
            </button>
            <button className="main-menu-btn" onClick={handleHome}> 
              main menu
            </button>
          </div>
        </div>
      )}
      
              <div className="header">
          <div className="logo-container" onClick={handleHome} style={{ cursor: 'pointer' }}>
            <img src={microMatrixSvg} alt="micro matrix" className="logo-img" />
          </div>
          <div className="game-info centered">Week 1: Ingram Micro Kickoff</div>
          <div className="header-controls">
          <div className="timer">{formatTime(time)}</div>
          <button className="control-btn pause-btn" onClick={togglePause}>
            <img src={pauseSvg} alt="pause" />
          </button>
          <button className="control-btn home-btn" onClick={handleHome}>
            <img src={homeSvg} alt="home" />
          </button>
        </div>
      </div>

      <div className="puzzle-container">
        <div className="active-clue">
          {activeClue
            ? `${activeClue.position}. ${activeClue.clue}`
            : "1. Insert clue here"}
        </div>
        
        <CrosswordGrid
          layout={layout}
          onCellChange={handleCellChange}
          userAnswers={userAnswers}
          activeInfo={activeInfo}
          onActiveInfoChange={setActiveInfo}
          incorrectCells={incorrectCells}
        />
      </div>

      <button onClick={() => checkAnswers()} className="check-button">
        Check Puzzle
      </button>
    </div>
  );
}

export default App;
