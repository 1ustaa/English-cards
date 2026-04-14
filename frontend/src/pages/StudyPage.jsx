import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Flashcard from '../components/Flashcard';
import { getModule, getStudyCard, recordResult } from '../services/api';

const StudyPage = () => {
  const { id } = useParams();
  const [module, setModule] = useState(null);
  const [studyCard, setStudyCard] = useState(undefined); // undefined - загружается, null - нет карточек
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyProgress, setStudyProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null); // 'success' or 'fail'

  useEffect(() => {
    loadModule();
    loadStudyCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadModule = async () => {
    try {
      const data = await getModule(id);
      setModule(data);
    } catch (err) {
      console.error('Error loading module:', err);
    }
  };

  const loadStudyCard = async () => {
    try {
      const data = await getStudyCard(id);
      if (data.card === null || data.card === undefined) {
        // Если карточек нет или все изучены
        setStudyCard(null);
      } else {
        setStudyCard(data.card);
      }
      setStudyProgress(data.progress);
      setIsFlipped(false);
      setResult(null);
    } catch (err) {
      console.error('Error loading study card:', err);
      setStudyCard(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResult = async (isSuccess) => {
    if (!studyCard) return;
    
    try {
      await recordResult(studyCard.id, isSuccess);
      setResult(isSuccess ? 'success' : 'fail');
      
      // Показываем результат и загружаем следующую карточку
      setTimeout(() => {
        loadStudyCard();
      }, 500);
    } catch (err) {
      console.error('Error recording result:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100">
      {/* Верхняя панель */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link to={`/module/${id}`} className="text-primary-600 hover:underline flex items-center text-sm">
              <span className="mr-2">←</span> <span className="hidden sm:inline">Назад к модулю</span><span className="sm:hidden">Назад</span>
            </Link>
            {module && (
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">{module.title}</h1>
            )}
            <div className="w-12 sm:w-20"></div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 pb-24 sm:pb-8">
        {/* Прогресс */}
        {studyProgress && (
          <div className="mb-4 sm:mb-6 text-center">
            <div className="inline-block bg-white rounded-full px-4 py-2 sm:px-6 sm:py-2 shadow-md">
              <span className="text-xs sm:text-sm text-gray-600">Прогресс: </span>
              <span className="font-bold text-primary-600 text-sm sm:text-base">
                {studyProgress.reviewed} / {studyProgress.total}
              </span>
            </div>
          </div>
        )}

        {/* Карточка */}
        <div className="flex justify-center mb-4 sm:mb-8">
          {studyCard ? (
            <div className="w-full max-w-md">
              <Flashcard card={studyCard} isFlipped={isFlipped} onFlip={handleFlip} />

              {/* Кнопки результатов */}
              {isFlipped && (
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 sm:space-x-4 mt-6 sm:mt-8">
                  <button
                    onClick={() => handleResult(false)}
                    className={`flex-1 sm:flex-none px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold sm:font-bold text-base sm:text-lg transition-all transform hover:scale-105 ${
                      result === 'fail'
                        ? 'bg-red-700 text-white'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    ❌ Не знаю
                  </button>
                  <button
                    onClick={() => handleResult(true)}
                    className={`flex-1 sm:flex-none px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold sm:font-bold text-base sm:text-lg transition-all transform hover:scale-105 ${
                      result === 'success'
                        ? 'bg-green-700 text-white'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    ✅ Знаю
                  </button>
                </div>
              )}

              {!isFlipped && (
                <div className="text-center mt-6 sm:mt-8">
                  <button
                    onClick={handleFlip}
                    className="px-6 py-3 sm:px-8 sm:py-4 bg-primary-600 text-white rounded-xl font-semibold sm:font-bold text-base sm:text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🔄 Перевернуть карточку
                  </button>
                  <p className="text-gray-500 mt-3 sm:mt-4 text-xs sm:text-sm">
                    Или нажмите на карточку
                  </p>
                </div>
              )}
            </div>
          ) : studyProgress && studyProgress.total === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <span className="text-5xl sm:text-6xl mb-3 sm:mb-4 block">📚</span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">В модуле нет карточек</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Добавьте карточки в модуль, чтобы начать обучение</p>
              <Link
                to={`/module/${id}/edit`}
                className="bg-primary-600 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-medium inline-block"
              >
                ✏️ Редактировать модуль
              </Link>
            </div>
          ) : studyCard === null ? (
            <div className="text-center py-12 sm:py-16">
              <span className="text-5xl sm:text-6xl mb-3 sm:mb-4 block">🎉</span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Все карточки изучены!</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Отличная работа! Хотите начать заново?</p>
              <button
                onClick={loadStudyCard}
                className="bg-primary-600 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-medium"
              >
                Начать заново
              </button>
            </div>
          ) : null}
        </div>

        {/* Статистика */}
        {studyProgress && studyProgress.total > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center">Статистика</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                  {studyProgress.total}
                </p>
                <p className="text-gray-500 text-xs sm:text-sm">Всего карточек</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {studyProgress.reviewed}
                </p>
                <p className="text-gray-500 text-xs sm:text-sm">Изучено</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {studyProgress.total - studyProgress.reviewed}
                </p>
                <p className="text-gray-500 text-xs sm:text-sm">Осталось</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPage;
