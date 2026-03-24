import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createModule } from '../services/api';

const CreateModulePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Название модуля обязательно');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newModule = await createModule({
        ...formData,
        user_id: 1, // Хардкодим для MVP
      });
      navigate(`/module/${newModule.id}`);
    } catch (err) {
      setError('Не удалось создать модуль. Попробуйте снова.');
      console.error('Error creating module:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="text-primary-600 hover:underline text-sm">
        ← Назад к модулям
      </Link>

      <div className="mt-6 bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Создать новый модуль</h1>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Название */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Название модуля *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Например: Базовые слова"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Описание */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Опишите, что входит в этот модуль..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Публичность */}
          <div className="mb-8">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700">
                Сделать модуль публичным (доступен другим пользователям)
              </span>
            </label>
          </div>

          {/* Кнопки */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Создание...' : 'Создать модуль'}
            </button>
            <Link
              to="/"
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
            >
              Отмена
            </Link>
          </div>
        </form>
      </div>

      {/* Подсказка по импорту CSV */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">📥 Хотите импортировать карточки?</h3>
        <p className="text-blue-700 text-sm mb-3">
          После создания модуля вы сможете загрузить карточки из CSV файла.
        </p>
        <p className="text-blue-600 text-xs">
          Формат: <code className="bg-blue-100 px-2 py-1 rounded">Слово;Перевод;Пример</code>
        </p>
      </div>
    </div>
  );
};

export default CreateModulePage;
