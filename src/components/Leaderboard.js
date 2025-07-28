import React from 'react';
import './Leaderboard.css';

const Leaderboard = ({ onBackToHome, onBackToPuzzle, hasCompletedPuzzle }) => {
  // Sample leaderboard data matching the design
  const leaderboardData = [
    { rank: 1, department: '[Blank] Department', points: 1000 },
    { rank: 2, department: '[Blank] Department', points: 800 },
    { rank: 3, department: '[Blank] Department', points: 600 },
    { rank: 4, department: '[Blank] Department', points: 400 },
    { rank: 5, department: '[Blank] Department', points: 200 },
    { rank: 12, department: '[Your] Department', points: 80 },
  ];

  const podiumData = [
    { position: 2, department: ['[Blank]', 'Department'], points: 800, label: '2nd' },
    { position: 1, department: ['[Blank]', 'Department'], points: 1000, label: '1st' },
    { position: 3, department: ['[Blank]', 'Department'], points: 600, label: '3rd' },
  ];

  return (
    <div className="leaderboard-container">
      {/* Leaderboard Content */}
      <div className="leaderboard-content">
        {/* Podium Display */}
        <div className="podium-container">
          {podiumData.map((item) => (
            <div key={item.position} className={`podium-wrapper podium-${item.position}`}>
              <div className="department-label">
                <div>{item.department[0]}</div>
                <div>{item.department[1]}</div>
              </div>
              <div className="podium-block">
                <div className="position-label">{item.label}</div>
                <div className="points-label">{item.points} points</div>
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="leaderboard-table-container">
          <div className="leaderboard-header">
            <h2>Leaderboard</h2>
            <div className="points-header">Points</div>
          </div>
          
          <div className="leaderboard-table">
            {leaderboardData.map((item, index) => (
              <React.Fragment key={index}>
                {/* Add separator line before "[Your] Department" */}
                {item.department.includes('[Your]') && <div className="separator-line"></div>}
                <div 
                  className={`leaderboard-row ${item.department.includes('[Your]') ? 'your-department' : ''}`}
                >
                  <div className="rank-cell">{item.rank}</div>
                  <div className="department-cell">{item.department}</div>
                  <div className="points-cell">{item.points}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="leaderboard-nav-buttons">
          {hasCompletedPuzzle ? (
            <>
              <button onClick={onBackToPuzzle} className="back-puzzle-btn">
                back to puzzle
              </button>
              <button onClick={onBackToHome} className="back-home-btn secondary">
                main menu
              </button>
            </>
          ) : (
            <button onClick={onBackToHome} className="back-home-btn">
              back to home
            </button>
          )}
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="coming-soon-overlay">
        <div className="coming-soon-popup">
          <div className="coming-soon-text">Coming Soon...</div>
          <div className="coming-soon-nav">
            {hasCompletedPuzzle ? (
              <>
                <button onClick={onBackToPuzzle} className="coming-soon-btn">
                  back to puzzle
                </button>
                <button onClick={onBackToHome} className="coming-soon-btn secondary">
                  main menu
                </button>
              </>
            ) : (
              <button onClick={onBackToHome} className="coming-soon-btn">
                back to home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 