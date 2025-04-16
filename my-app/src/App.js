import React, { useState, useEffect } from 'react';
import MainPage from './components/MainPage';
import AuthContainer from './components/auth/AuthContainer';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  // 如果用户已认证，显示主页面
  if (isAuthenticated) {
    return <MainPage onLogout={handleLogout} />;
  }

  return (
    <div className="App">
      <AuthContainer onAuthenticated={handleAuthenticated} />
    </div>
  );
}

export default App;
