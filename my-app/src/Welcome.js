import React from 'react';
import './App.css';

function Welcome() {
  const handleLogout = () => {
    // Clear any stored tokens or state
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="App">
      <div className="auth-container">
        <h1>Welcome!</h1>
        <p className="welcome-text">You have successfully logged in.</p>
        <button onClick={handleLogout} className="logout-button">
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Welcome; 