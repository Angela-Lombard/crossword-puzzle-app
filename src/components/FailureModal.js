import React from "react";
import "./FailureModal.css";

const FailureModal = ({ onPlayAgain, onMainMenu, onLeaderboard, onClose, togglePause }) => (
  <div className="modal-backdrop">
    <div className="modal-content">
      <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
        ×
      </button>
      <div className="failure-header">
        <h2>Almost There!</h2>
        <p>Some of the words are incorrect. Please try again.</p>
      </div>
      <div className="modal-buttons">
          <button className="resume-btn" onClick={onClose} aria-label="Close modal">
            resume
          </button>
      </div>
    </div>
  </div>
);

export default FailureModal; 