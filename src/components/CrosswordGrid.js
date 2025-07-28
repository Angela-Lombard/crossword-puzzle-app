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

    const wordsAtCell = placedWords.filter((word) => {
      const startX = word.startx - 1;
      const startY = word.starty - 1;
      if (word.orientation === "across") {
        return y === startY && x >= startX && x < startX + word.answer.length;
      } else {
        return x === startX && y >= startY && y < startY + word.answer.length;
      }
    });

    if (wordsAtCell.length === 0) return;

    // Check if user clicked on the same cell as currently selected
    const isSameCell = selectedCell && selectedCell.x === x && selectedCell.y === y;
    
    // Check if this cell is part of the currently active word
    const currentActiveWord = wordsAtCell.find(
      word => word.position === activeInfo.position && word.orientation === activeInfo.orientation
    );
    
    // If clicking the same cell or clicking a cell that's part of current active word 
    // and there are multiple words at this intersection, toggle direction
    if ((isSameCell || currentActiveWord) && wordsAtCell.length > 1) {
      // Find the current word in the list
      const currentWordIndex = wordsAtCell.findIndex(
        word => word.position === activeInfo.position && word.orientation === activeInfo.orientation
      );
      
      if (currentWordIndex !== -1) {
        // Switch to the next word in the list (cycling through all words at this cell)
        const nextWordIndex = (currentWordIndex + 1) % wordsAtCell.length;
        const nextWord = wordsAtCell[nextWordIndex];
        
        setSelectedCell({ x, y });
        onActiveInfoChange({
          position: nextWord.position,
          orientation: nextWord.orientation,
        });
      } else {
        // Fallback: if current word not found, pick a different orientation
        const currentOrientation = activeInfo.orientation;
        const differentWord = wordsAtCell.find(word => word.orientation !== currentOrientation);
        if (differentWord) {
          setSelectedCell({ x, y });
          onActiveInfoChange({
            position: differentWord.position,
            orientation: differentWord.orientation,
          });
        } else {
          // If no different orientation, just select the first word
          setSelectedCell({ x, y });
          onActiveInfoChange({
            position: wordsAtCell[0].position,
            orientation: wordsAtCell[0].orientation,
          });
        }
      }
    } else {
      // New cell selection - prioritize "across" direction when first clicking a cell
      setSelectedCell({ x, y });
      
      // If there's an across word at this position, select it; otherwise select the first word
      const acrossWord = wordsAtCell.find(word => word.orientation === "across");
      const wordToSelect = acrossWord || wordsAtCell[0];
      
      onActiveInfoChange({
        position: wordToSelect.position,
        orientation: wordToSelect.orientation,
      });
    }
  };

  const handleFocus = (x, y) => {
    // Only select the cell, don't change orientation during focus
    // (orientation changes should only happen on actual clicks)
    if (!grid[y] || !grid[y][x] || grid[y][x] === '-') return;
    
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
      // Only change word if this cell is not part of the current active word
      if (!isCellInActiveWord(x, y)) {
        // Prioritize "across" direction when focusing on a new cell
        const acrossWord = wordsAtCell.find(word => word.orientation === "across");
        const wordToSelect = acrossWord || wordsAtCell[0];
        onActiveInfoChange({
          position: wordToSelect.position,
          orientation: wordToSelect.orientation,
        });
      }
    }
  };

  const handleInputChange = (e, x, y) => {
    const value = e.target.value.toUpperCase();
    onCellChange(x, y, value);

    if (value && activeClue) {
      const startX = activeClue.startx - 1;
      const startY = activeClue.starty - 1;
      
      // Find current position within the active word
      let currentIndex = -1;
      if (activeClue.orientation === "across") {
        currentIndex = x - startX;
      } else {
        currentIndex = y - startY;
      }
      
      // Find the next empty cell in the same word
      let nextIndex = currentIndex + 1;
      while (nextIndex < activeClue.answer.length) {
        let nextX, nextY;
        
        if (activeClue.orientation === "across") {
          nextX = startX + nextIndex;
          nextY = startY;
        } else {
          nextX = startX;
          nextY = startY + nextIndex;
        }
        
        // Check if the next cell exists and is part of this word
        if (nextX >= 0 && nextY >= 0 && 
            nextX < (grid[0]?.length || 0) && nextY < grid.length &&
            isCellInActiveWord(nextX, nextY)) {
          
          // If the cell is empty, move focus there
          if (!userAnswers[nextY]?.[nextX] || userAnswers[nextY][nextX] === "") {
            setTimeout(() => {
              inputRefs.current[nextY]?.[nextX]?.focus();
            }, 0);
            break;
          }
          // If the cell is filled, continue to the next one
          nextIndex++;
        } else {
          break;
        }
      }
    }
  };

  const handleKeyDown = (e, x, y) => {
    if (e.key === "Backspace" && userAnswers[y]?.[x] === "" && activeClue) {
      const startX = activeClue.startx - 1;
      const startY = activeClue.starty - 1;
      
      // Find current position within the active word
      let currentIndex = -1;
      if (activeClue.orientation === "across") {
        currentIndex = x - startX;
      } else {
        currentIndex = y - startY;
      }
      
      // Move to the previous position in the same word
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        let prevX, prevY;
        
        if (activeClue.orientation === "across") {
          prevX = startX + prevIndex;
          prevY = startY;
        } else {
          prevX = startX;
          prevY = startY + prevIndex;
        }
        
        // Only move if the previous cell exists and is part of this word
        if (prevX >= 0 && prevY >= 0 && 
            prevX < (grid[0]?.length || 0) && prevY < grid.length &&
            isCellInActiveWord(prevX, prevY)) {
          setTimeout(() => {
            inputRefs.current[prevY]?.[prevX]?.focus();
          }, 0);
        }
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
              
              // Check if this cell has multiple words (intersection)
              const wordsAtCell = hasLetter ? placedWords.filter((word) => {
                const startX = word.startx - 1;
                const startY = word.starty - 1;
                if (word.orientation === "across") {
                  return y === startY && x >= startX && x < startX + word.answer.length;
                } else {
                  return x === startX && y >= startY && y < startY + word.answer.length;
                }
              }) : [];
              
              const isIntersection = wordsAtCell.length > 1;
              
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
                if (isIntersection) {
                  cellClass += ' intersection';
                }
              }
              
              return (
                <td 
                  key={x} 
                  className={cellClass}
                  data-number={cellNumber}
                  onClick={() => handleCellClick(x, y)}
                  style={{ cursor: hasLetter ? 'pointer' : 'default' }}
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
