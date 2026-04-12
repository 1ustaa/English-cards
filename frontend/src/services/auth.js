import api from './api';

/**
 * Auth API сервис.
 * 
 * Функции:
 * - register
 * - login
 * - verifyToken
 * - getMe
 */

/**
 * Регистрация нового пользователя
 */
export const register = async (username, email, password) => {
  const response = await api.post('/auth/register', {
    username,
    email,
    password,
  });
  return response.data;
};

/**
 * Вход пользователя
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};

/**
 * Проверка валидности токена
 */
export const verifyToken = async () => {
  const response = await api.post('/auth/verify');
  return response.data;
};

/**
 * Получить данные текущего пользователя
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export default {
  register,
  login,
  verifyToken,
  getMe,
};
