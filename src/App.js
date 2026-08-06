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

const API_BASE = process.env.REACT_APP_API_BASE || "";
const buildStorageKey = (puzzleId) => `crosswordState_${puzzleId || 'current'}`;

function App() {
  const [currentScreen, setCurrentScreen] = useState("home");
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('crosswordStreak');
    return saved ? parseInt(saved) : 0;
  });
  const [layout, setLayout] = useState({ result: [], rows: 15, cols: 15, table: [] });
  const [puzzleId, setPuzzleId] = useState(null);
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

  const startGame = async () => {
    await generateNewPuzzle();
    setCurrentScreen("game");
    setTime(0);
    setIsPaused(false);
    setIncorrectCells([]);
    setShowFailureModal(false);
  };

  const generateNewPuzzle = async () => {
    const resp = await fetch(`${API_BASE}/api/puzzle`);
    const data = await resp.json();

    const serverLayout = data.layout || { rows: 15, cols: 15, result: [], table: [] };
    setLayout(serverLayout);
    setPuzzleId(data.puzzleId);

    if (serverLayout && serverLayout.rows && serverLayout.cols) {
      setUserAnswers(
        Array(serverLayout.rows)
          .fill(null)
          .map(() => Array(serverLayout.cols).fill(""))
      );
    }
    setIsSolved(false);
    setIncorrectCells([]);

    if (serverLayout && serverLayout.result) {
      const placedWords = serverLayout.result.filter(w => w.orientation !== "none");
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

    // Try to restore saved state for this puzzle
    const key = buildStorageKey(data.puzzleId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.puzzleId === data.puzzleId) {
          if (Array.isArray(saved.userAnswers)) setUserAnswers(saved.userAnswers);
          if (typeof saved.time === 'number') setTime(saved.time);
          if (saved.activeInfo) setActiveInfo(saved.activeInfo);
          if (Array.isArray(saved.incorrectCells)) setIncorrectCells(saved.incorrectCells);
          if (typeof saved.isPaused === 'boolean') setIsPaused(saved.isPaused);
          if (saved.currentScreen) setCurrentScreen(saved.currentScreen);
        }
      }
    } catch {}
  };

  const goToMainMenu = () => {
    setCurrentScreen("home");
    setTime(0);
    setIsPaused(false);
    setIsSolved(false);
    setShowSuccessModal(false);
    setShowFailureModal(false);
    setCompletedPuzzleState(null);
    setIncorrectCells([]);
  };

  const goToCompletedPuzzle = () => {
    if (completedPuzzleState) {
      setLayout(completedPuzzleState.layout);
      setUserAnswers(completedPuzzleState.userAnswers);
      setTime(completedPuzzleState.time);
      setStreak(completedPuzzleState.streak);
      setIsSolved(true);
      setShowSuccessModal(false);
      setShowFailureModal(false);
      setCurrentScreen("game");

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
  };

  const goToLeaderboard = () => {
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
    // On app load, fetch the puzzle so home can quickly switch to game
    generateNewPuzzle();
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    const key = buildStorageKey(puzzleId);
    try {
      if (!puzzleId) return;
      const snapshot = {
        puzzleId,
        userAnswers,
        time,
        activeInfo,
        isPaused,
        incorrectCells,
        currentScreen,
      };
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {}
  }, [puzzleId, userAnswers, time, activeInfo, isPaused, incorrectCells, currentScreen]);

  useEffect(() => {
    if (layout.result && layout.result.length > 0) {
      checkForCompletion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAnswers, layout.result]);

  const handleCellChange = (x, y, value) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[y][x] = value.toUpperCase();
    setUserAnswers(newUserAnswers);
    setIncorrectCells(prev => prev.filter((c) => c.x !== x || c.y !== y));
    setCorrectCells(prev => prev.filter((c) => c.x !== x || c.y !== y));
  };

  const [correctCells, setCorrectCells] = useState([]);

  // Compute whether all fillable cells have an input; if yes, server-validate
  const checkForCompletion = async () => {
    if (!layout?.table || !layout?.rows || !layout?.cols) return;

    let allFilled = true;
    for (let y = 0; y < layout.rows; y++) {
      for (let x = 0; x < layout.cols; x++) {
        const cell = layout.table?.[y]?.[x];
        if (cell && cell !== '-') {
          const val = userAnswers?.[y]?.[x];
          if (!val || val.trim() === '') {
            allFilled = false;
            break;
          }
        }
      }
      if (!allFilled) break;
    }

    if (!allFilled) {
      setShowFailureModal(false);
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId, answers: userAnswers })
      });
      const data = await resp.json();

      if (data.allFilled && data.allCorrect) {
        setIsSolved(true);
        setShowSuccessModal(true);
        setShowFailureModal(false);
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem('crosswordStreak', newStreak.toString());
        // All correct means everything filled is correct
        const allCorrectCells = [];
        for (let y = 0; y < layout.rows; y++) {
          for (let x = 0; x < layout.cols; x++) {
            const cell = layout.table?.[y]?.[x];
            if (cell && cell !== '-') {
              allCorrectCells.push({ x, y });
            }
          }
        }
        setCorrectCells(allCorrectCells);
      } else if (data.allFilled && !data.allCorrect) {
        setIncorrectCells(data.incorrectCells || []);
        // Mark other filled cells as correct (visual feedback)
        const incorrectSet = new Set((data.incorrectCells || []).map(c => `${c.x},${c.y}`));
        const newlyCorrect = [];
        for (let y = 0; y < layout.rows; y++) {
          for (let x = 0; x < layout.cols; x++) {
            const cell = layout.table?.[y]?.[x];
            const val = userAnswers?.[y]?.[x];
            if (cell && cell !== '-' && val && !incorrectSet.has(`${x},${y}`)) {
              newlyCorrect.push({ x, y });
            }
          }
        }
        setCorrectCells(newlyCorrect);
        setShowFailureModal(true);
      }
    } catch (e) {
      // fallback: do nothing
    }
  };

  const checkAnswers = async () => {
    if (!puzzleId) return;
    try {
      const resp = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId, answers: userAnswers })
      });
      const data = await resp.json();
      setIncorrectCells(data.incorrectCells || []);
      const incorrectSet = new Set((data.incorrectCells || []).map(c => `${c.x},${c.y}`));
      const newlyCorrect = [];
      for (let y = 0; y < layout.rows; y++) {
        for (let x = 0; x < layout.cols; x++) {
          const cell = layout.table?.[y]?.[x];
          const val = userAnswers?.[y]?.[x];
          if (cell && cell !== '-' && val && !incorrectSet.has(`${x},${y}`)) {
            newlyCorrect.push({ x, y });
          }
        }
      }
      setCorrectCells(newlyCorrect);
    } catch (e) {}
  };

  const submitScore = async (displayName, department) => {
    if (!puzzleId) return;
    try {
      const resp = await fetch(`${API_BASE}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId, answers: userAnswers, displayName, department, timeSec: time })
      });
      const data = await resp.json();
      if (data && data.success) {
        goToLeaderboard();
      }
    } catch (e) {}
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
          apiBase={API_BASE}
        />
      </div>
    );
  }

  return (
    <div className="App game-screen">
      {isSolved && <Confetti style={{ zIndex: 1001 }} />}
      {showSuccessModal && (
        <SuccessModal
          onMainMenu={goToMainMenu}
          onClose={closeSuccessModal}
        />
      )}

      {showFailureModal && (
        <FailureModal 
        onClose={closeFailureModal} 
        />
      )}

      <div className="header">
        <div className="logo-container" onClick={handleHome} style={{ cursor: 'pointer' }}>
          <img src={microMatrixSvg} alt="micro matrix" className="logo-img" />
        </div>
        <div className="game-info" />
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

      <div className="game-container">
        {activeClue && (
          <div className="active-clue">
            {`${activeClue.position}. ${activeClue.clue}`}
          </div>
        )}
        <CrosswordGrid
          layout={layout}
          onCellChange={handleCellChange}
          userAnswers={userAnswers}
          activeInfo={activeInfo}
          onActiveInfoChange={setActiveInfo}
          incorrectCells={incorrectCells}
          correctCells={correctCells}
        />
      </div>

      {/* Single Check button below puzzle */}
      <button onClick={checkAnswers} className="check-button">Check Puzzle</button>

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
    </div>
  );
}

export default App;
