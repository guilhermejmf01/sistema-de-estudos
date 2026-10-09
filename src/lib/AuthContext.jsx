import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const mockUser = {
  id: 'usr_mock_123',
  email: 'guilhermejmf01@gmail.com',
  name: 'Guilherme',
  role: 'admin',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(mockUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(true);
  const [appPublicSettings, setAppPublicSettings] = useState({});

  useEffect(() => {
    // Garante que a sessão permaneça válida localmente
    localStorage.setItem('token', 'mock-valid-token-123');
    localStorage.setItem('base44_access_token', 'mock-valid-token-123');
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setIsAuthenticated(true);
    setAuthChecked(true);
  };

  const checkUserAuth = async () => {
    setUser(mockUser);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('base44_access_token');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
