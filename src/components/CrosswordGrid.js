// src/components/CrosswordGrid.js
import React, { useState, useRef } from "react";
import "./CrosswordGrid.css";

const CrosswordGrid = ({
  layout,
  onCellChange,
  userAnswers,
  activeInfo,
  onActiveInfoChange,
  incorrectCells,
}) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const inputRefs = useRef(
    Array.from({ length: layout.rows || 15 }, () => Array.from({ length: layout.cols || 15 }, () => null))
  );

  const grid = layout.table || [];
  const placedWords = layout.result ? layout.result.filter(w => w.orientation !== "none") : [];

  const activeClue = placedWords.find(
    (w) => w.position === activeInfo.position && w.orientation === activeInfo.orientation
  );

  const isCellInActiveWord = (x, y) => {
    if (!activeClue || !grid[y] || !grid[y][x] || grid[y][x] === '-') return false;
    
    const startX = activeClue.startx - 1;
    const startY = activeClue.starty - 1;
    
    if (activeClue.orientation === "across") {
      return y === startY && x >= startX && x < startX + activeClue.answer.length;
    } else {
      return x === startX && y >= startY && y < startY + activeClue.answer.length;
    }
  };

  const isCellIncorrect = (x, y) => {
    return incorrectCells.some(cell => cell.x === x && cell.y === y);
  };

  const getCellNumber = (x, y) => {
    const wordAtStart = placedWords.find((word) => {
      const startX = word.startx - 1;
      const startY = word.starty - 1;
      return x === startX && y === startY;
    });
    return wordAtStart ? wordAtStart.position : null;
  };

  const handleCellClick = (x, y) => {
    if (!grid[y] || !grid[y][x] || grid[y][x] === '-') return;

    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    console.log(`\n=== CLICK ${newClickCount} ===`);
    console.log(`Clicked: (${x},${y})`);
    console.log(`selectedCell BEFORE:`, selectedCell);
    console.log(`activeInfo BEFORE:`, activeInfo);

    // SUPER SIMPLE TEST: Just hardcode the cell (3,3) which should be part of both 1-across and 3-down
    if (x === 3 && y === 3) {
      console.log(`*** HARDCODED TEST CELL (3,3) ***`);
      
      if (selectedCell && selectedCell.x === 3 && selectedCell.y === 3) {
        // Same cell - toggle
        console.log(`🔄 SAME CELL - TOGGLE!`);
        if (activeInfo.orientation === 'across') {
          console.log(`Switching to DOWN`);
          onActiveInfoChange({ position: 3, orientation: 'down' });
        } else {
          console.log(`Switching to ACROSS`);
          onActiveInfoChange({ position: 1, orientation: 'across' });
        }
      } else {
        // New cell
        console.log(`🆕 NEW CELL - SELECT ACROSS`);
        setSelectedCell({ x: 3, y: 3 });
        onActiveInfoChange({ position: 1, orientation: 'across' });
      }
      return;
    }

    // For all other cells, just basic logic
    const wordsAtCell = placedWords.filter((word) => {
      const startX = word.startx - 1;
      const startY = word.starty - 1;
      if (word.orientation === "across") {
        return y === startY && x >= startX && x < startX + word.answer.length;
      } else {
        return x === startX && y >= startY && y < startY + word.answer.length;
      }
    });

    if (wordsAtCell.length > 0) {
      setSelectedCell({ x, y });
      const wordToSelect = wordsAtCell[0];
      onActiveInfoChange({
        position: wordToSelect.position,
        orientation: wordToSelect.orientation,
      });
    }
  };

  const handleFocus = (x, y) => {
    handleCellClick(x, y);
  };

  const handleInputChange = (e, x, y) => {
    const value = e.target.value.toUpperCase();
    onCellChange(x, y, value);

    if (value && activeClue) {
      const startX = activeClue.startx - 1;
      const startY = activeClue.starty - 1;
      
      for (let i = 1; i < activeClue.answer.length; i++) {
        let nextX, nextY;
        
        if (activeClue.orientation === "across") {
          nextX = x + i;
          nextY = y;
        } else {
          nextX = x;
          nextY = y + i;
        }

        if (isCellInActiveWord(nextX, nextY)) {
          if (!userAnswers[nextY]?.[nextX] || userAnswers[nextY][nextX] === "") {
            setTimeout(() => {
              inputRefs.current[nextY]?.[nextX]?.focus();
            }, 0);
            break;
          }
        } else {
          break;
        }
      }
    }
  };

  const handleKeyDown = (e, x, y) => {
    if (e.key === "Backspace" && userAnswers[y]?.[x] === "" && activeClue) {
      let prevX = x;
      let prevY = y;

      if (activeClue.orientation === "across") {
        prevX = x - 1;
      } else {
        prevY = y - 1;
      }

      if (isCellInActiveWord(prevX, prevY)) {
        setTimeout(() => {
          inputRefs.current[prevY]?.[prevX]?.focus();
        }, 0);
      }
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      let currentX = x;
      let currentY = y;

      const move = () => {
        switch (e.key) {
          case "ArrowUp":
            currentY--;
            break;
          case "ArrowDown":
            currentY++;
            break;
          case "ArrowLeft":
            currentX--;
            break;
          case "ArrowRight":
            currentX++;
            break;
        }
      };

      move();

      while (
        currentY >= 0 &&
        currentY < grid.length &&
        currentX >= 0 &&
        currentX < (grid[0]?.length || 0)
      ) {
        if (grid[currentY] && grid[currentY][currentX] && grid[currentY][currentX] !== '-') {
          setTimeout(() => {
            inputRefs.current[currentY]?.[currentX]?.focus();
          }, 0);
          return;
        }
        move();
      }
    }
  };

  return (
    <table className="crossword-grid">
      <tbody>
        {grid.map((row, y) => (
          <tr key={y}>
            {row.map((cell, x) => {
              const hasLetter = cell && cell !== '-';
              const isHighlighted = isCellInActiveWord(x, y);
              const isFocused = selectedCell && selectedCell.x === x && selectedCell.y === y;
              const isIncorrect = isCellIncorrect(x, y);
              const cellNumber = getCellNumber(x, y);
              
              let cellClass = '';
              if (hasLetter) {
                cellClass = 'filled';
                if (isFocused) {
                  cellClass += ' focused';
                } else if (isHighlighted) {
                  cellClass += ' highlighted';
                }
                if (isIncorrect) {
                  cellClass += ' incorrect';
                }
                if (cellNumber) {
                  cellClass += ' with-number';
                }
              }
              
              return (
                <td 
                  key={x} 
                  className={cellClass}
                  data-number={cellNumber}
                >
                  {hasLetter && (
                    <input
                      ref={(el) => {
                        if (inputRefs.current[y]) {
                          inputRefs.current[y][x] = el;
                        }
                      }}
                      type="text"
                      maxLength="1"
                      onChange={(e) => handleInputChange(e, x, y)}
                      onFocus={() => handleFocus(x, y)}
                      onKeyDown={(e) => handleKeyDown(e, x, y)}
                      value={userAnswers[y]?.[x] || ""}
                    />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CrosswordGrid;
