import axios from 'axios';

// Базовый URL API (используем прокси Vite в development)
const API_BASE_URL = '/api/v1';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления JWT токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обработки 401 ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен невалиден, удаляем
      localStorage.removeItem('token');
      // Перенаправляем на login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// МОДУЛИ (Modules/Decks)
// ============================================

/**
 * Получить список всех модулей
 */
export const getModules = async (params = {}) => {
  const response = await api.get('/modules', { params });
  return response.data;
};

/**
 * Получить модуль по ID с карточками
 */
export const getModule = async (moduleId) => {
  const response = await api.get(`/modules/${moduleId}`);
  return response.data;
};

/**
 * Создать новый модуль
 */
export const createModule = async (moduleData) => {
  const response = await api.post('/modules', moduleData);
  return response.data;
};

/**
 * Обновить модуль
 */
export const updateModule = async (moduleId, moduleData) => {
  const response = await api.put(`/modules/${moduleId}`, moduleData);
  return response.data;
};

/**
 * Удалить модуль
 */
export const deleteModule = async (moduleId) => {
  const response = await api.delete(`/modules/${moduleId}`);
  return response.data;
};

/**
 * Клонировать модуль
 */
export const cloneModule = async (moduleId) => {
  const response = await api.post(`/modules/${moduleId}/clone`);
  return response.data;
};

/**
 * Импортировать карточки из CSV
 */
export const importCardsFromCSV = async (moduleId, file, hasHeader = false) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/modules/${moduleId}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: { has_header: hasHeader },
  });
  return response.data;
};

/**
 * Получить статистику модуля
 */
export const getModuleStats = async (moduleId) => {
  const response = await api.get(`/modules/${moduleId}/stats`);
  return response.data;
};

// ============================================
// КАРТОЧКИ (Cards)
// ============================================

/**
 * Получить список карточек
 */
export const getCards = async (params = {}) => {
  const response = await api.get('/cards', { params });
  return response.data;
};

/**
 * Получить карточку по ID
 */
export const getCard = async (cardId) => {
  const response = await api.get(`/cards/${cardId}`);
  return response.data;
};

/**
 * Создать карточку
 */
export const createCard = async (cardData) => {
  const response = await api.post('/cards', cardData);
  return response.data;
};

/**
 * Обновить карточку
 */
export const updateCard = async (cardId, cardData) => {
  const response = await api.put(`/cards/${cardId}`, cardData);
  return response.data;
};

/**
 * Удалить карточку
 */
export const deleteCard = async (cardId) => {
  const response = await api.delete(`/cards/${cardId}`);
  return response.data;
};

// ============================================
// ОБУЧЕНИЕ (Study Modes)
// ============================================

/**
 * Получить карточку для изучения (Flashcards)
 */
export const getStudyCard = async (moduleId) => {
  const response = await api.get(`/cards/study/${moduleId}`);
  return response.data;
};

/**
 * Записать результат изучения
 */
export const recordResult = async (cardId, isSuccess) => {
  const response = await api.post(`/cards/${cardId}/record`, {
    is_success: isSuccess,
  });
  return response.data;
};

/**
 * Получить карточки для работы над ошибками
 */
export const getReviewCards = async (moduleId, limit = 10, minErrors = 1) => {
  const response = await api.get(`/cards/review/${moduleId}`, {
    params: { limit, min_errors: minErrors },
  });
  return response.data;
};

/**
 * Получить данные для теста (Quiz)
 */
export const getQuizData = async (moduleId, cardId = null) => {
  const params = cardId ? { card_id: cardId } : {};
  const response = await api.get(`/cards/quiz/${moduleId}`, { params });
  return response.data;
};

/**
 * Получить прогресс обучения по модулю
 */
export const getLearningProgress = async (moduleId) => {
  const response = await api.get(`/cards/${moduleId}/progress`);
  return response.data;
};

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Проверка статуса сервера
 */
export const checkHealth = async () => {
  const response = await axios.get('/health');
  return response.data;
};

// ============================================
// ЗАУЧИВАНИЕ (Study Session)
// ============================================

/**
 * Начать сессию заучивания
 */
export const startStudySession = async (moduleId) => {
  const response = await api.post(`/modules/${moduleId}/study-session`, {});
  return response.data;
};

/**
 * Проверить ответ
 */
export const checkAnswer = async (sessionId, questionId, answer) => {
  const response = await api.post(`/modules/study-session/${sessionId}/check`, {
    questionId,
    answer,
  });
  return response.data;
};

/**
 * Получить подсказку
 */
export const getHint = async (sessionId, questionId) => {
  const response = await api.get(`/modules/study-session/${sessionId}/hint`, {
    params: { questionId },
  });
  return response.data;
};

/**
 * Завершить сессию
 */
export const finishStudySession = async (sessionId) => {
  const response = await api.post(`/modules/study-session/${sessionId}/finish`, {});
  return response.data;
};

export default api;
