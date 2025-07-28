import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import CrosswordGrid from "./components/CrosswordGrid";
import SuccessModal from "./components/SuccessModal";
import Leaderboard from "./components/Leaderboard";
import "./App.css";
import { 
  createObfuscatedPuzzle, 
  decodeMultiLayer, 
  validateAnswer, 
  addAntiDebugProtection 
} from "./utils/puzzleSecurity";
const crosswordLayoutGenerator = require("crossword-layout-generator");

// Raw puzzle data (will be obfuscated immediately)
const rawPuzzleWords = [
  // { clue: "Popular UI library", answer: "react" },
  // { clue: "Runtime for JS", answer: "node" },
  // { clue: "Cloud platform", answer: "aws" },
  // { clue: "Search engine giant", answer: "google" },
  // { clue: "Version control site", answer: "github" },
  // { clue: "Commander, Bay", answer: "paul" },
  // { clue: "We share business and five consecutive letters.", answer: "microsoft" },
  // { clue: "Where the Dreamin began. Homeland.", answer: "california" },
  // { clue: "Repair place.", answer: "techxpress" },
  // { clue: "Goods and services giver.", answer: "vendor" },
  // { clue: "Minds wander here. We have the solution.", answer: "cloud" },
  // { clue: "The name of the mountain we summit?", answer: "one" },
  // { clue: "Thank you for choosing us, biggest spender.", answer: "cdw" },
  // { clue: "That product? Solid.", answer: "hardware" },
  // { clue: "Neither here nor there on the scale of business.", answer: "smb" },
  // { clue: "Our speediest asset", answer: "xvantage" },

    { clue: "We share business and five consecutive letters.", answer: "microsoft" },
    { clue: "That product? Solid.", answer: "hardware" },
    { clue: "Our speediest asset", answer: "xvantage" },
    { clue: "Where the Dreamin began. Homeland.", answer: "california" },
    { clue: "Repair place.", answer: "techxpress" },
    { clue: "Minds wander here. We have the solution.", answer: "cloud" },
    { clue: "Goods and services giver.", answer: "vendor" },
    { clue: "Commander, Bay", answer: "paul" },
    { clue: "The name of the mountain we summit?", answer: "one" },
    { clue: "Thank you for choosing us, biggest spender.", answer: "cdw" },
    { clue: "Neither here nor there on the scale of business.", answer: "smb" }
];

// Create obfuscated puzzle data
const puzzleData = createObfuscatedPuzzle(rawPuzzleWords);

// Clear raw data from memory
rawPuzzleWords.length = 0;

// Create layout-compatible format with decoded answers (only when needed)
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

  // State to track if user came from completed puzzle
  const [completedPuzzleState, setCompletedPuzzleState] = useState(null);
  
  // State to control success modal visibility (separate from solved state)
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Timer effect
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
    // Go to home screen and reset game state
    setCurrentScreen("home");
    setTime(0);
    setIsPaused(false);
  };

  const startGame = () => {
    generateNewPuzzle();
    setCurrentScreen("game");
    setTime(0);
    setIsPaused(false);
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
    
    // Set the first clue as active by default
    if (layoutData && layoutData.result) {
      const placedWords = layoutData.result.filter(w => w.orientation !== "none");
      if (placedWords.length > 0) {
        // Find the first clue (lowest position number)
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
  };

  const goToMainMenu = () => {
    setCurrentScreen("home");
    setTime(0);
    setIsPaused(false);
    setIsSolved(false);
    setShowSuccessModal(false);
    setCompletedPuzzleState(null); // Clear completed puzzle state
  };

  const goToCompletedPuzzle = () => {
    if (completedPuzzleState) {
      // Restore the completed puzzle state
      setLayout(completedPuzzleState.layout);
      setUserAnswers(completedPuzzleState.userAnswers);
      setTime(completedPuzzleState.time);
      setStreak(completedPuzzleState.streak);
      setIsSolved(true);
      setShowSuccessModal(false); // Don't show modal when returning from leaderboard
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
    // Initialize anti-debugging protection
    addAntiDebugProtection();
  }, []);

  useEffect(() => {
    if (layout.result && layout.result.length > 0) {
      checkAnswers(true);
    }
  }, [userAnswers, layout.result]);

  const handleCellChange = (x, y, value) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[y][x] = value.toUpperCase();
    setUserAnswers(newUserAnswers);
    setIncorrectCells(prev => prev.filter((c) => c.x !== x || c.y !== y));
  };

  // Enhanced answer checking with secure validation
  const checkAnswers = (isSilent = false) => {
    if (!layout.result) return;
    const incorrect = [];
    let allFilled = true;
    const placedWords = layout.result.filter((w) => w.orientation !== "none");
    
    placedWords.forEach((word) => {
      // Get user's answer for this word
      let userAnswer = '';
      for (let i = 0; i < word.answer.length; i++) {
        const x = word.orientation === "across" ? word.startx - 1 + i : word.startx - 1;
        const y = word.orientation === "down" ? word.starty - 1 + i : word.starty - 1;
        
        if (!userAnswers[y]?.[x]) {
          allFilled = false;
          userAnswer += '';
        } else {
          userAnswer += userAnswers[y][x];
        }
      }
      
      // Find matching puzzle data for validation
      const puzzleWord = puzzleData.find(p => 
        decodeMultiLayer(p.encodedAnswer).toUpperCase() === word.answer.toUpperCase()
      );
      
      if (puzzleWord && userAnswer.length === puzzleWord.length) {
        // Use secure validation method
        const isCorrect = validateAnswer(userAnswer, puzzleWord.encodedAnswer, puzzleWord.answerHash);
        
        if (!isCorrect) {
          // Mark incorrect cells
          for (let i = 0; i < word.answer.length; i++) {
            const x = word.orientation === "across" ? word.startx - 1 + i : word.startx - 1;
            const y = word.orientation === "down" ? word.starty - 1 + i : word.starty - 1;
            if (userAnswers[y]?.[x] && userAnswers[y][x] !== word.answer[i].toUpperCase()) {
              incorrect.push({ x, y });
            }
          }
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
          setShowSuccessModal(true);
          const newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem('crosswordStreak', newStreak.toString());
        }, 250);
      } else {
        setIsSolved(true);
        setShowSuccessModal(true);
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem('crosswordStreak', newStreak.toString());
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

  if (currentScreen === "home") {
    return (
      <div className="App home-screen">
        <div className="home-content">
          <div className="home-logo-container">
            <img src={process.env.PUBLIC_URL + "/microMatrix.svg"} alt="micro matrix" className="home-logo" />
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
            <img src={process.env.PUBLIC_URL + "/microMatrix.svg"} alt="micro matrix" className="logo-img" />
          </div>
          <div className="game-info centered">Week 1: Ingram Micro Kickoff</div>
          <div className="header-controls">
            <div className="timer">{formatTime(time)}</div>
            <button className="control-btn pause-btn" onClick={togglePause}>
              <img src={process.env.PUBLIC_URL + "/Play/Pause.svg"} alt="pause" />
            </button>
            <button className="control-btn home-btn" onClick={handleHome}>
              <img src={process.env.PUBLIC_URL + "/Home.svg"} alt="home" />
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
            <img src={process.env.PUBLIC_URL + "/microMatrix.svg"} alt="micro matrix" className="logo-img" />
          </div>
          <div className="game-info centered">Week 1: Ingram Micro Kickoff</div>
          <div className="header-controls">
          <div className="timer">{formatTime(time)}</div>
          <button className="control-btn pause-btn" onClick={togglePause}>
            <img src={process.env.PUBLIC_URL + "/Play/Pause.svg"} alt="pause" />
          </button>
          <button className="control-btn home-btn" onClick={handleHome}>
            <img src={process.env.PUBLIC_URL + "/Home.svg"} alt="home" />
          </button>
        </div>
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
      </div>

      <div className="active-clue">
        {activeClue
          ? `${activeClue.position}. ${activeClue.clue}`
          : "1. Insert clue here"}
      </div>

      <button onClick={() => checkAnswers(false)} className="check-button">
        Check Puzzle
      </button>
    </div>
  );
}

export default App;
