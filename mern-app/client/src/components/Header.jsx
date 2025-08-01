import React from 'react';
import './Header.css'; // We will create this CSS file next

const Header = ({ userInfo, onLogout, onNavigate }) => {
  return (
    <header className="app-header">
      <div className="logo">
        <h1>✨ AI Glow Up</h1>
      </div>
      <nav className="navigation">
        {userInfo ? (
          <>
            <span className="welcome-user">Welcome, {userInfo.name}!</span>
            <button onClick={onLogout} className="nav-button logout-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onNavigate('login')} className="nav-button">
              Login
            </button>
            <button onClick={() => onNavigate('register')} className="nav-button signup-button">
              Sign Up
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
