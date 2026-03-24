import { useState } from 'react';
import { createModule } from '../services/api';
import { useToast } from '../context/ToastContext';

const CreateModuleModal = ({ isOpen, onClose, onSuccess }) => {
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
        user_id: 1,
      });
      toast.success('Модуль создан');
      onSuccess(newModule);
      setFormData({ title: '', description: '', is_public: false });
    } catch (err) {
      toast.error('Не удалось создать модуль');
      console.error('Error creating module:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Фон-затемнение */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Модальное окно */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* Заголовок */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Новый модуль</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Название */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Например: Базовые слова"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Описание */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Опишите, что входит в этот модуль..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Публичность */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_public"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_public" className="text-sm text-gray-700">
                  Сделать модуль публичным (доступен другим пользователям)
                </label>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание...' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateModuleModal;
