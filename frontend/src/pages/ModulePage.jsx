import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getModule, deleteModule } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ModulePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    loadModule();
  }, [id]);

  const loadModule = async () => {
    try {
      setLoading(true);
      const data = await getModule(id);
      setModule(data);
    } catch (err) {
      console.error('Error loading module:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (module && currentCardIndex < module.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот модуль? Все карточки будут удалены.')) {
      return;
    }
    
    try {
      await deleteModule(id);
      toast.success('Модуль удалён');
      navigate('/');
    } catch (err) {
      toast.error('Ошибка при удалении модуля');
      console.error('Error deleting module:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка модуля..." />;
  }

  if (!module) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/" className="text-primary-600 hover:underline">← Назад к модулям</Link>
        <p className="mt-4 text-gray-600">Модуль не найден</p>
      </div>
    );
  }

  const currentCard = module.cards[currentCardIndex];
  const totalCards = module.cards.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Навигация */}
      <div className="mb-6">
        <Link to="/" className="text-primary-600 hover:underline text-sm">
          ← Назад к модулям
        </Link>
      </div>

      {/* Заголовок модуля */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
            <p className="text-gray-600">{module.description || 'Нет описания'}</p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                🃏 {totalCards} карточек
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
            >
              <span className="mr-1">🗑️</span>
              Удалить модуль
            </button>
          </div>
        </div>
      </div>

      {/* Кнопки режимов */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Link
          to={`/module/${id}`}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md text-center font-medium"
        >
          📇 Карточки
        </Link>
        <Link
          to={`/module/${id}/study`}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md text-center font-medium"
        >
          🔊 Заучивание
        </Link>
        <Link
          to={`/module/${id}/quiz`}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md text-center font-medium"
        >
          📝 Тест
        </Link>
        <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md text-center font-medium">
          ⊞ Блоки
        </button>
        <button className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-4 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-md text-center font-medium">
          🚀 Blast
        </button>
        <button className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md text-center font-medium">
          🔀 Подбор
        </button>
      </div>

      {/* Область карточек */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center space-x-1">
            <span>💡</span>
            <span>Показать подсказку</span>
          </button>
          <div className="flex space-x-2">
            <button className="text-gray-400 hover:text-gray-600">✏️</button>
            <button className="text-gray-400 hover:text-gray-600">🔊</button>
            <button className="text-gray-400 hover:text-gray-600">⭐</button>
          </div>
        </div>

        {/* Карточка с 3D переворотом */}
        <div className="flex justify-center mb-6">
          <div 
            className="flip-card w-full max-w-md h-80 cursor-pointer"
            onClick={handleFlip}
          >
            <div 
              className="flip-card-inner relative w-full h-full"
              style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Лицевая сторона */}
              <div className="flip-card-front absolute w-full h-full">
                <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border-4 border-primary-200 hover:border-primary-400 transition-all flex items-center justify-center p-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide">Термин</p>
                    <p className="text-4xl font-bold text-gray-900">{currentCard?.term}</p>
                    <p className="text-gray-400 text-sm mt-8">Нажмите чтобы перевернуть</p>
                  </div>
                </div>
              </div>

              {/* Обратная сторона */}
              <div className="flip-card-back absolute w-full h-full">
                <div className="w-full h-full bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl shadow-xl border-4 border-primary-300 flex items-center justify-center p-8">
                  <div className="text-center">
                    <p className="text-sm text-primary-600 mb-4 uppercase tracking-wide">Определение</p>
                    <p className="text-3xl font-bold text-gray-900">{currentCard?.definition}</p>
                    {currentCard?.example && (
                      <div className="mt-6 pt-6 border-t border-primary-200">
                        <p className="text-sm text-primary-600 mb-2">Пример:</p>
                        <p className="text-base text-gray-700 italic">"{currentCard.example}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input type="checkbox" className="rounded border-gray-300" />
              <span>Отслеживать прогресс</span>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrev}
              disabled={currentCardIndex === 0}
              className="p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ←
            </button>
            <span className="px-4 text-gray-600 font-medium">
              {currentCardIndex + 1} / {totalCards}
            </span>
            <button 
              onClick={handleNext}
              disabled={currentCardIndex >= totalCards - 1}
              className="p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              →
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all">
              ▶
            </button>
            <button className="p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all">
              🔀
            </button>
            <button className="p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all">
              ⚙
            </button>
            <button className="p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all">
              ⛶
            </button>
          </div>
        </div>
      </div>

      {/* Дополнительные действия */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to={`/module/${id}/edit`}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-4 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md text-center font-medium"
        >
          ✏️ Редактировать карточки
        </Link>
        <Link
          to={`/module/${id}/review`}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md text-center font-medium"
        >
          ⚠️ Работа над ошибками
        </Link>
      </div>
    </div>
  );
};

export default ModulePage;
