import React, { createContext, useState, useEffect } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem('token', token);
      // fetch profile
      api.get('/auth/me').then((res) => setUser(res.data.data)).catch(() => { setUser(null); });
    } else {
      setAuthToken(null);
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = (token) => setToken(token);
  const logout = () => setToken(null);

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};

export default AuthContext;
