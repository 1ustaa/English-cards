import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createModule } from '../services/api';
import { useToast } from '../context/ToastContext';

const CreateModulePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
  });
  const [loading, setLoading] = useState(false);

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
      toast.error('Введите название модуля');
      return;
    }

    try {
      setLoading(true);
      const newModule = await createModule({
        ...formData,
        user_id: 1, // TODO: Заменить на реальный user_id после добавления авторизации
      });
      toast.success('Модуль создан');
      // Переходим к редактированию карточек нового модуля
      navigate(`/module/${newModule.id}/edit`);
    } catch (err) {
      toast.error('Не удалось создать модуль');
      console.error('Error creating module:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Новый модуль</h1>
        <p className="text-gray-600 mt-2">Создайте модуль для изучения новых слов</p>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Название */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Название <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Например: Базовые слова"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-lg"
              autoFocus
            />
          </div>

          {/* Описание */}
          <div>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Публичность */}
          {/* <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="is_public"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              className="w-5 h-5 mt-0.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <div>
              <label htmlFor="is_public" className="text-sm font-medium text-gray-700 cursor-pointer">
                Сделать модуль публичным
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Публичные модули доступны другим пользователям для изучения
              </p>
            </div>
          </div> */}
        </div> 

        {/* Кнопки */}
        <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Создание...' : 'Создать модуль'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateModulePage;
