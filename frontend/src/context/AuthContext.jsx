import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({ id: 0, name: 'Dev', email: 'dev@local', status: 'active' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (email, password, name) => {
    const res = await api.post('/auth/register', { email, password, name });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isPremium = () => {
    if (!user) return false;
    if (user.status === 'active') return true;
    if (user.status === 'trial' && user.trial_ends_at) {
      return new Date(user.trial_ends_at) > new Date();
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading, isPremium }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
