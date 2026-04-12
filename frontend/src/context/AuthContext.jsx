/**
 * Auth Context для управления состоянием авторизации.
 * 
 * Предоставляет:
 * - Текущий пользователь
 * - JWT токен
 * - Функции login, register, logout
 * - Статус загрузки
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, verifyToken, getMe } from '../services/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // При загрузке проверяем токен
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          // Проверяем валидность токена
          const response = await verifyToken();
          setUser(response.user);
          setToken(storedToken);
        } catch (error) {
          // Токен невалиден, удаляем
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await loginApi(email, password);
      const { user, token } = response;
      
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка входа';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setIsLoading(true);
    try {
      const response = await registerApi(username, email, password);
      const { user, token } = response;
      
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      
      return { success: true, user };
    } catch (error) {
      const errors = error.response?.data?.errors || {};
      const message = error.response?.data?.error || 'Ошибка регистрации';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
