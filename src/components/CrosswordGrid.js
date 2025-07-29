// src/components/CrosswordGrid.js
import React, { useState, useRef, useEffect } from "react";
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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const inputRefs = useRef(
    Array.from({ length: layout.rows || 15 }, () => Array.from({ length: layout.cols || 15 }, () => null))
  );

  // Detect mobile device on component mount
  useEffect(() => {
    const checkMobileDevice = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             (typeof window !== 'undefined' && window.innerWidth <= 768);
    };
    setIsMobileDevice(checkMobileDevice());
  }, []);

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

    const isSameCell = selectedCell && selectedCell.x === x && selectedCell.y === y;
    
    const currentActiveWord = wordsAtCell.find(
      word => word.position === activeInfo.position && word.orientation === activeInfo.orientation
    );
    
    if ((isSameCell || currentActiveWord) && wordsAtCell.length > 1) {
      const currentWordIndex = wordsAtCell.findIndex(
        word => word.position === activeInfo.position && word.orientation === activeInfo.orientation
      );
      
      if (currentWordIndex !== -1) {
        const nextWordIndex = (currentWordIndex + 1) % wordsAtCell.length;
        const nextWord = wordsAtCell[nextWordIndex];
        
        setSelectedCell({ x, y });
        onActiveInfoChange({
          position: nextWord.position,
          orientation: nextWord.orientation,
        });
      } else {
        const currentOrientation = activeInfo.orientation;
        const differentWord = wordsAtCell.find(word => word.orientation !== currentOrientation);
        if (differentWord) {
          setSelectedCell({ x, y });
          onActiveInfoChange({
            position: differentWord.position,
            orientation: differentWord.orientation,
          });
        } else {
          setSelectedCell({ x, y });
          onActiveInfoChange({
            position: wordsAtCell[0].position,
            orientation: wordsAtCell[0].orientation,
          });
        }
      }
    } else {
      setSelectedCell({ x, y });
      
      const acrossWord = wordsAtCell.find(word => word.orientation === "across");
      const wordToSelect = acrossWord || wordsAtCell[0];
      
      onActiveInfoChange({
        position: wordToSelect.position,
        orientation: wordToSelect.orientation,
      });
    }
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

    if (wordsAtCell.length > 0) {
      setSelectedCell({ x, y });
      if (!isCellInActiveWord(x, y)) {
        const acrossWord = wordsAtCell.find(word => word.orientation === "across");
        const wordToSelect = acrossWord || wordsAtCell[0];
        onActiveInfoChange({
          position: wordToSelect.position,
          orientation: wordToSelect.orientation,
        });
      }
      
      // Mobile-specific behavior: select all text for easier editing
      if (isMobileDevice) {
        setTimeout(() => {
          const inputElement = inputRefs.current[y]?.[x];
          if (inputElement && userAnswers[y]?.[x]) {
            // Select all text so typing replaces it
            inputElement.select();
            // Also set cursor to end as fallback
            inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
          }
        }, 0);
      }
    }
  };

  const handleInputChange = (e, x, y) => {
    const value = e.target.value.toUpperCase();
    
    // On mobile, ensure we only keep the last character typed if multiple chars somehow get entered
    const finalValue = isMobileDevice && value.length > 1 ? value.slice(-1) : value;
    
    onCellChange(x, y, finalValue);

    // Mobile-specific: Ensure cursor is positioned correctly after input
    if (isMobileDevice && finalValue) {
      setTimeout(() => {
        const inputElement = inputRefs.current[y]?.[x];
        if (inputElement) {
          inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
        }
      }, 0);
    }

    if (finalValue && activeClue) {
      const startX = activeClue.startx - 1;
      const startY = activeClue.starty - 1;
      
      let currentIndex = -1;
      if (activeClue.orientation === "across") {
        currentIndex = x - startX;
      } else {
        currentIndex = y - startY;
      }
      
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
        
        if (nextX >= 0 && nextY >= 0 && 
            nextX < (grid[0]?.length || 0) && nextY < grid.length &&
            isCellInActiveWord(nextX, nextY)) {
          
          if (!userAnswers[nextY]?.[nextX] || userAnswers[nextY][nextX] === "") {
            setTimeout(() => {
              inputRefs.current[nextY]?.[nextX]?.focus();
            }, 0);
            break;
          }
          nextIndex++;
        } else {
          break;
        }
      }
    }
  };

  const handleKeyDown = (e, x, y) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      const incompleteWords = placedWords.filter(word => {
        const startX = word.startx - 1;
        const startY = word.starty - 1;
        
        for (let i = 0; i < word.answer.length; i++) {
          let cellX, cellY;
          if (word.orientation === "across") {
            cellX = startX + i;
            cellY = startY;
          } else {
            cellX = startX;
            cellY = startY + i;
          }
          
          if (!userAnswers[cellY]?.[cellX] || userAnswers[cellY][cellX] === "") {
            return true;
          }
        }
        return false;
      });
      
      if (incompleteWords.length === 0) return;
      
      const currentWordIndex = incompleteWords.findIndex(
        word => word.position === activeInfo.position && word.orientation === activeInfo.orientation
      );
      
      let nextWordIndex;
      if (currentWordIndex === -1) {
        nextWordIndex = 0;
      } else {
        nextWordIndex = (currentWordIndex + 1) % incompleteWords.length;
      }
      
      const nextWord = incompleteWords[nextWordIndex];
      
      onActiveInfoChange({
        position: nextWord.position,
        orientation: nextWord.orientation,
      });
      
      const nextStartX = nextWord.startx - 1;
      const nextStartY = nextWord.starty - 1;
      
      for (let i = 0; i < nextWord.answer.length; i++) {
        let cellX, cellY;
        if (nextWord.orientation === "across") {
          cellX = nextStartX + i;
          cellY = nextStartY;
        } else {
          cellX = nextStartX;
          cellY = nextStartY + i;
        }
        
        if (!userAnswers[cellY]?.[cellX] || userAnswers[cellY][cellX] === "") {
          setTimeout(() => {
            inputRefs.current[cellY]?.[cellX]?.focus();
            setSelectedCell({ x: cellX, y: cellY });
          }, 0);
          break;
        }
      }
      
      return;
    }
    
    if (e.key === "Backspace") {
      // Mobile-specific backspace behavior
      if (isMobileDevice) {
        // Always clear current cell first, regardless of content
        if (userAnswers[y]?.[x]) {
          e.preventDefault();
          onCellChange(x, y, "");
          // Keep focus on current cell after clearing
          setTimeout(() => {
            const inputElement = inputRefs.current[y]?.[x];
            if (inputElement) {
              inputElement.focus();
              inputElement.setSelectionRange(0, 0);
            }
          }, 0);
          return;
        }
        // If current cell is empty, then move to previous cell
        if (activeClue) {
          e.preventDefault();
          const startX = activeClue.startx - 1;
          const startY = activeClue.starty - 1;
          
          let currentIndex = -1;
          if (activeClue.orientation === "across") {
            currentIndex = x - startX;
          } else {
            currentIndex = y - startY;
          }
          
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
            
            if (prevX >= 0 && prevY >= 0 && 
                prevX < (grid[0]?.length || 0) && prevY < grid.length &&
                isCellInActiveWord(prevX, prevY)) {
              setTimeout(() => {
                inputRefs.current[prevY]?.[prevX]?.focus();
                setSelectedCell({ x: prevX, y: prevY });
              }, 0);
            }
          }
        }
      } else {
        // Desktop backspace behavior (original logic)
        if (userAnswers[y]?.[x] === "" && activeClue) {
          const startX = activeClue.startx - 1;
          const startY = activeClue.starty - 1;
          
          let currentIndex = -1;
          if (activeClue.orientation === "across") {
            currentIndex = x - startX;
          } else {
            currentIndex = y - startY;
          }
          
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
            
            if (prevX >= 0 && prevY >= 0 && 
                prevX < (grid[0]?.length || 0) && prevY < grid.length &&
                isCellInActiveWord(prevX, prevY)) {
              setTimeout(() => {
                inputRefs.current[prevY]?.[prevX]?.focus();
              }, 0);
            }
          }
        }
      }
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      
      let targetX = x;
      let targetY = y;
      
      switch (e.key) {
        case "ArrowUp":
          targetY = y - 1;
          break;
        case "ArrowDown":
          targetY = y + 1;
          break;
        case "ArrowLeft":
          targetX = x - 1;
          break;
        case "ArrowRight":
          targetX = x + 1;
          break;
      }
      
      if (targetY >= 0 && targetY < grid.length && 
          targetX >= 0 && targetX < (grid[0]?.length || 0) &&
          grid[targetY] && grid[targetY][targetX] && grid[targetY][targetX] !== '-') {
        
        setTimeout(() => {
          inputRefs.current[targetY]?.[targetX]?.focus();
          setSelectedCell({ x: targetX, y: targetY });
        }, 0);
        
        const wordsAtTargetCell = placedWords.filter((word) => {
          const startX = word.startx - 1;
          const startY = word.starty - 1;
          if (word.orientation === "across") {
            return targetY === startY && targetX >= startX && targetX < startX + word.answer.length;
          } else {
            return targetX === startX && targetY >= startY && targetY < startY + word.answer.length;
          }
        });
        
        if (wordsAtTargetCell.length > 0) {
          const isPartOfCurrentWord = wordsAtTargetCell.some(
            word => word.position === activeInfo.position && word.orientation === activeInfo.orientation
          );
          
          if (!isPartOfCurrentWord) {
            const acrossWord = wordsAtTargetCell.find(word => word.orientation === "across");
            const wordToSelect = acrossWord || wordsAtTargetCell[0];
            
            onActiveInfoChange({
              position: wordToSelect.position,
              orientation: wordToSelect.orientation,
            });
          }
        }
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
                      // Mobile-specific attributes for better input handling
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck="false"
                      inputMode={isMobileDevice ? "text" : "text"}
                      style={isMobileDevice ? {
                        caretColor: 'transparent', // Hide cursor on mobile to avoid positioning issues
                      } : {}}
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
