import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fitbot_user')); } catch { return null; }
  });

  const saveAuth = (token, userData) => {
    localStorage.setItem('fitbot_token', token);
    localStorage.setItem('fitbot_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data; // { step: 'verify', email }
  };

  const verifyRegistration = async (email, otp) => {
    const res = await api.post('/auth/verify-registration', { email, otp });
    saveAuth(res.data.token, res.data.user);
    return res.data.user;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    saveAuth(res.data.token, res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('fitbot_token');
    localStorage.removeItem('fitbot_user');
    setUser(null);
  };

  const updateUser = useCallback((partial) => {
    setUser(prev => {
      const updated = { ...prev, ...partial };
      localStorage.setItem('fitbot_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, register, verifyRegistration, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
