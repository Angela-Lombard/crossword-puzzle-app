import React, { useEffect, useState } from 'react';
import './Leaderboard.css';

const Leaderboard = ({ onBackToHome, onBackToPuzzle, hasCompletedPuzzle, apiBase = '' }) => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetch(`${apiBase}/api/leaderboard`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted) return;
        setEntries(data.entries || []);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [apiBase]);

  const podiumData = entries.slice(0, 3).map((e, idx) => ({
    position: idx === 0 ? 1 : idx === 1 ? 2 : 3,
    department: [e.displayName || 'Anonymous', e.department || ''],
    points: e.points,
    label: idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd'
  }));

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
            {entries.map((item, index) => (
              <React.Fragment key={index}>
                <div 
                  className={`leaderboard-row ${index === 0 ? 'your-department' : ''}`}
                >
                  <div className="rank-cell">{index + 1}</div>
                  <div className="department-cell">{item.displayName || 'Anonymous'}{item.department ? ` (${item.department})` : ''}</div>
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