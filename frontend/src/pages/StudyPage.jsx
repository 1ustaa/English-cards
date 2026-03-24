import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Flashcard from '../components/Flashcard';
import { getModule, getStudyCard, recordResult } from '../services/api';

const StudyPage = () => {
  const { id } = useParams();
  const [module, setModule] = useState(null);
  const [studyCard, setStudyCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyProgress, setStudyProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null); // 'success' or 'fail'

  useEffect(() => {
    loadModule();
    loadStudyCard();
  }, [id]);

  const loadModule = async () => {
    try {
      const data = await getModule(id);
      setModule(data);
    } catch (err) {
      console.error('Error loading module:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudyCard = async () => {
    try {
      const data = await getStudyCard(id);
      setStudyCard(data.card);
      setStudyProgress(data.progress);
      setIsFlipped(false);
      setResult(null);
    } catch (err) {
      console.error('Error loading study card:', err);
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to={`/module/${id}`} className="text-primary-600 hover:underline flex items-center">
              <span className="mr-2">←</span> Назад к модулю
            </Link>
            {module && (
              <h1 className="text-xl font-semibold text-gray-900">{module.title}</h1>
            )}
            <div className="w-20"></div> {/* Для центрирования */}
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Прогресс */}
        {studyProgress && (
          <div className="mb-6 text-center">
            <div className="inline-block bg-white rounded-full px-6 py-2 shadow-md">
              <span className="text-gray-600">Прогресс: </span>
              <span className="font-bold text-primary-600">
                {studyProgress.reviewed} / {studyProgress.total}
              </span>
            </div>
          </div>
        )}

        {/* Карточка */}
        <div className="flex justify-center mb-8">
          {studyCard ? (
            <div className="w-full max-w-md">
              <Flashcard card={studyCard} isFlipped={isFlipped} onFlip={handleFlip} />
              
              {/* Кнопки результатов */}
              {isFlipped && (
                <div className="flex justify-center space-x-4 mt-8">
                  <button
                    onClick={() => handleResult(false)}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                      result === 'fail' 
                        ? 'bg-red-700 text-white' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    ❌ Не знаю
                  </button>
                  <button
                    onClick={() => handleResult(true)}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
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
                <div className="text-center mt-8">
                  <button
                    onClick={handleFlip}
                    className="px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🔄 Перевернуть карточку
                  </button>
                  <p className="text-gray-500 mt-4 text-sm">
                    Или нажмите на карточку
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🎉</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Все карточки изучены!</h2>
              <p className="text-gray-600 mb-6">Отличная работа! Хотите начать заново?</p>
              <button
                onClick={loadStudyCard}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Начать заново
              </button>
            </div>
          )}
        </div>

        {/* Статистика */}
        {studyProgress && studyProgress.total > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Статистика</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary-600">
                  {studyProgress.total}
                </p>
                <p className="text-gray-500 text-sm">Всего карточек</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {studyProgress.reviewed}
                </p>
                <p className="text-gray-500 text-sm">Изучено</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-600">
                  {studyProgress.total - studyProgress.reviewed}
                </p>
                <p className="text-gray-500 text-sm">Осталось</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPage;
