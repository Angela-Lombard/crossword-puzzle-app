// src/components/SuccessModal.js
import React from "react";
import "./SuccessModal.css";

const SuccessModal = ({ onPlayAgain }) => (
  <div className="modal-backdrop">
    <div className="modal-content">
      <h2>Congratulations!</h2>
      <p>You've successfully solved the puzzle!</p>
      <button onClick={onPlayAgain} className="play-again-button">
        Play Again
      </button>
    </div>
  </div>
);

export default SuccessModal; 