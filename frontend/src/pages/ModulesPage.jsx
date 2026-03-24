import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ModuleCard from '../components/ModuleCard';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateModuleModal from '../components/CreateModuleModal';
import { getModules } from '../services/api';

const ModulesPage = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const data = await getModules();
      setModules(data.modules || []);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить модули. Убедитесь, что сервер запущен.');
      console.error('Error loading modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleCreated = (newModule) => {
    setIsModalOpen(false);
    // Добавляем новый модуль в список
    setModules(prev => [newModule, ...prev]);
    // Переходим к редактированию карточек нового модуля
    navigate(`/module/${newModule.id}/edit`);
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка модулей..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadModules}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мои модули</h1>
          <p className="text-gray-600 mt-1">
            {modules.length} {modules.length === 1 ? 'модуль' : modules.length < 5 ? 'модуля' : 'модулей'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center shadow-md"
        >
          <span className="text-xl mr-2">+</span>
          Создать модуль
        </button>
      </div>

      {/* Список модулей */}
      {modules.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">📚</span>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Нет модулей</h2>
          <p className="text-gray-600 mb-6">Создайте первый модуль, чтобы начать изучение</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Создать модуль
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      )}

      {/* Модальное окно создания модуля */}
      <CreateModuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModuleCreated}
      />
    </div>
  );
};

export default ModulesPage;
