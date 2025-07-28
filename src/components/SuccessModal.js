import React from "react";
import "./SuccessModal.css";

const SuccessModal = ({ onPlayAgain, onMainMenu, onLeaderboard, onClose }) => (
  <div className="modal-backdrop">
    <div className="modal-content">
      <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
        ×
      </button>
      <div className="success-header">
        <h2>Success!</h2>
        <p>You've successfully completed this week's crossword puzzle.</p>
      </div>
      <div className="modal-buttons">
        <button onClick={onLeaderboard} className="modal-btn leaderboard-btn">
          leaderboard
        </button>
        <button onClick={onMainMenu} className="modal-btn main-menu-btn">
          main menu
        </button>
      </div>
    </div>
  </div>
);

export default SuccessModal; 