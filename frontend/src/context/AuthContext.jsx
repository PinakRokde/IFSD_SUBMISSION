import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('countdown-user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('countdown-token'));

  useEffect(() => {
    if (user) {
      localStorage.setItem('countdown-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('countdown-user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('countdown-token', token);
    } else {
      localStorage.removeItem('countdown-token');
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  const login = ({ user: nextUser, token: nextToken }) => {
    setUser(nextUser);
    setToken(nextToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
