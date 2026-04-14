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

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Игнорируем если фокус на input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'Space':
          e.preventDefault();
          handleFlip();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCardIndex, isFlipped, module]);

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
    if (module && module.cards.length > 0) {
      // Круговая навигация - если последняя карточка, переходим к первой
      setCurrentCardIndex(prev => (prev + 1) % module.cards.length);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (module && module.cards.length > 0) {
      // Круговая навигация - если первая карточка, переходим к последней
      setCurrentCardIndex(prev => (prev - 1 + module.cards.length) % module.cards.length);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (e) => {
    e.stopPropagation(); // Чтобы не переворачивать карточку
    
    if (!currentCard?.term) {
      return;
    }
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentCard.term);
      utterance.lang = 'en-US'; // Английский язык
      utterance.rate = 0.9; // Немного медленнее для лучшего восприятия
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 sm:pb-24">
      {/* Навигация */}
      <div className="mb-4 sm:mb-6">
        <Link to="/" className="text-primary-600 hover:underline text-sm">
          ← Назад к модулям
        </Link>
      </div>

      {/* Заголовок модуля */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
            <p className="text-sm sm:text-base text-gray-600">{module.description || 'Нет описания'}</p>
            <div className="flex items-center space-x-4 mt-3 text-xs sm:text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                🃏 {totalCards} карточек
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDelete}
              className="flex items-center px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-xs sm:text-sm font-medium"
            >
              <span className="mr-1">🗑️</span>
              Удалить модуль
            </button>
          </div>
        </div>
      </div>

      {/* Область карточек */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-8">
        {/* Подсказка о горячих клавишах - скрываем на мобильных */}
        <div className="hidden sm:flex justify-end mb-4">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded">←</span>
            <span className="px-2 py-1 bg-gray-100 rounded">→</span>
            <span>листать</span>
            <span className="mx-2">•</span>
            <span className="px-3 py-1 bg-gray-100 rounded">Пробел</span>
            <span>перевернуть</span>
          </div>
        </div>

        {/* Карточка с 3D переворотом */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div
            className="flip-card w-full max-w-md h-64 sm:h-80 cursor-pointer"
            onClick={handleFlip}
          >
            <div 
              className="flip-card-inner relative w-full h-full"
              style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Лицевая сторона */}
              <div className="flip-card-front absolute w-full h-full">
                <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border-4 border-primary-200 hover:border-primary-400 transition-all flex items-center justify-center p-4 sm:p-8 relative">
                  {/* Кнопка произношения */}
                  <button
                    onClick={handleSpeak}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-3 bg-white text-gray-600 rounded-full hover:bg-primary-100 hover:text-primary-600 transition-all shadow-md"
                    title="Произнести (английский)"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 11H2a1 1 0 01-1-1V6a1 1 0 011-1h2.586l3.707-5.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4 uppercase tracking-wide">Термин</p>
                    <p className="text-2xl sm:text-4xl font-bold text-gray-900">{currentCard?.term}</p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-4 sm:mt-8">Нажмите чтобы перевернуть</p>
                  </div>
                </div>
              </div>

              {/* Обратная сторона */}
              <div className="flip-card-back absolute w-full h-full">
                <div className="w-full h-full bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl shadow-xl border-4 border-primary-300 flex items-center justify-center p-4 sm:p-8 relative">
                  {/* Кнопка произношения */}
                  <button
                    onClick={handleSpeak}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-3 bg-white text-primary-600 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-all shadow-md"
                    title="Произнести (английский)"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 11H2a1 1 0 01-1-1V6a1 1 0 011-1h2.586l3.707-5.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-primary-600 mb-2 sm:mb-4 uppercase tracking-wide">Определение</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900">{currentCard?.definition}</p>
                    {currentCard?.example && (
                      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-primary-200">
                        <p className="text-xs sm:text-sm text-primary-600 mb-2">Пример:</p>
                        <p className="text-sm sm:text-base text-gray-700 italic">"{currentCard.example}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex items-center justify-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              className="p-2 sm:p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all text-sm sm:text-base"
              title="Предыдущая карточка (←)"
            >
              ←
            </button>
            <span className="px-3 sm:px-4 text-gray-600 font-medium text-sm sm:text-base">
              {currentCardIndex + 1} / {totalCards}
            </span>
            <button
              onClick={handleNext}
              className="p-2 sm:p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all text-sm sm:text-base"
              title="Следующая карточка (→)"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Фиксированные кнопки действий внизу - видны всегда */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-3 sm:p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-3">
          <Link
            to={`/module/${id}/edit`}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md text-center font-medium text-sm sm:text-lg"
          >
            ✏️ Редактировать
          </Link>
          <Link
            to={`/module/${id}/study-session`}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md text-center font-medium text-sm sm:text-lg"
          >
            📖 Заучивание
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ModulePage;
