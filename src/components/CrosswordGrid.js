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
  const [focusedCell, setFocusedCell] = useState({ x: -1, y: -1 });
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

  const handleFocus = (x, y) => {
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

    if (wordsAtCell.length === 0) {
      onActiveInfoChange({ position: null, orientation: "across" });
      setFocusedCell({ x, y });
      return;
    }

    const isSameCell = focusedCell.x === x && focusedCell.y === y;
    setFocusedCell({ x, y });

    if (isSameCell && wordsAtCell.length > 1) {
      const acrossWord = wordsAtCell.find(w => w.orientation === "across");
      const downWord = wordsAtCell.find(w => w.orientation === "down");

      if (acrossWord && downWord) {
        const newWord = activeInfo.orientation === "across" ? downWord : acrossWord;
        onActiveInfoChange({
          position: newWord.position,
          orientation: newWord.orientation,
        });
        return;
      }
    }

    const acrossWord = wordsAtCell.find(w => w.orientation === "across");
    const downWord = wordsAtCell.find(w => w.orientation === "down");
    
    let wordToSelect;
    if (acrossWord && downWord) {
      if (activeInfo.orientation === "across" && acrossWord) {
        wordToSelect = acrossWord;
      } else if (activeInfo.orientation === "down" && downWord) {
        wordToSelect = downWord;
      } else {
        wordToSelect = acrossWord;
      }
    } else {
      wordToSelect = acrossWord || downWord;
    }

    onActiveInfoChange({
      position: wordToSelect.position,
      orientation: wordToSelect.orientation,
    });
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

  const tableStyle = {
    borderCollapse: 'collapse',
    margin: '20px auto'
  };

  const cellStyle = {
    width: '35px',
    height: '35px',
    textAlign: 'center',
    verticalAlign: 'middle',
    padding: '0',
    position: 'relative',
    border: '1px solid transparent'
  };

  const filledCellStyle = {
    ...cellStyle,
    border: '1px solid #777',
    backgroundColor: 'white'
  };

  const highlightedCellStyle = {
    ...filledCellStyle,
    backgroundColor: '#dbeafe'
  };

  const focusedCellStyle = {
    ...filledCellStyle,
    backgroundColor: '#a0a0ff',
    outline: '2px solid #007bff'
  };

  const inputStyle = {
    width: '100%',
    height: '100%',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    textTransform: 'uppercase'
  };

  const incorrectInputStyle = {
    ...inputStyle,
    color: '#dc3545',
    textDecoration: 'line-through',
    textDecorationColor: '#dc3545',
    textDecorationThickness: '2px'
  };

  return (
    <table style={tableStyle}>
      <tbody>
        {grid.map((row, y) => (
          <tr key={y}>
            {row.map((cell, x) => {
              const hasLetter = cell && cell !== '-';
              const isHighlighted = isCellInActiveWord(x, y);
              const isFocused = focusedCell.x === x && focusedCell.y === y;
              const isIncorrect = isCellIncorrect(x, y);
              
              let cellStyleToUse = cellStyle;
              if (hasLetter) {
                if (isFocused) {
                  cellStyleToUse = focusedCellStyle;
                } else if (isHighlighted) {
                  cellStyleToUse = highlightedCellStyle;
                } else {
                  cellStyleToUse = filledCellStyle;
                }
              }
              
              return (
                <td key={x} style={cellStyleToUse}>
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
                      style={isIncorrect ? incorrectInputStyle : inputStyle}
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
