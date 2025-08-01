import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import Advisor from './Advisor'; // We will create this next

function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [page, setPage] = useState('advisor'); // 'advisor', 'login', 'register'

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
      setPage('advisor');
    } else {
      setPage('login'); // If no user info, default to login page
    }
  }, []);

  const handleLoginSuccess = (data) => {
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUserInfo(data);
    setPage('advisor');
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    setPage('login');
  };

  const renderPage = () => {
    if (userInfo) {
      // If user is logged in, always show the advisor
      return <Advisor />;
    }
    // If logged out, show login or register page
    switch (page) {
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} onNavigate={setPage} />;
      case 'register':
        return <Register onLoginSuccess={handleLoginSuccess} onNavigate={setPage} />;
      default:
        return <Login onLoginSuccess={handleLoginSuccess} onNavigate={setPage} />;
    }
  };

  return (
    <>
      <Header userInfo={userInfo} onLogout={handleLogout} onNavigate={setPage} />
      <main>
        {renderPage()}
      </main>
    </>
  );
}

export default App;
