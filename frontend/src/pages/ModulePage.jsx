import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Flashcard from '../components/Flashcard';
import { getModule, getStudyCard, recordResult, deleteModule } from '../services/api';
import { useToast } from '../context/ToastContext';

const ModulePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Для режима обучения
  const [studyCard, setStudyCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyProgress, setStudyProgress] = useState(null);

  // Для создания карточки
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ term: '', definition: '', example: '' });

  useEffect(() => {
    loadModule();
  }, [id]);

  const loadModule = async () => {
    try {
      setLoading(true);
      const data = await getModule(id);
      setModule(data);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить модуль');
      console.error('Error loading module:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот модуль?')) return;
    
    try {
      await deleteModule(id);
      toast.success('Модуль удалён');
      navigate('/');
    } catch (err) {
      toast.error('Ошибка при удалении модуля');
    }
  };

  const loadStudyCard = async () => {
    try {
      const data = await getStudyCard(id);
      setStudyCard(data.card);
      setStudyProgress(data.progress);
      setIsFlipped(false);
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
      loadStudyCard();
    } catch (err) {
      console.error('Error recording result:', err);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCard.term.trim() || !newCard.definition.trim()) {
      toast.error('Заполните термин и определение');
      return;
    }
    
    try {
      await createCard({
        module_id: parseInt(id),
        ...newCard,
      });
      setNewCard({ term: '', definition: '', example: '' });
      setShowAddCard(false);
      loadModule();
      toast.success('Карточка добавлена');
    } catch (err) {
      toast.error('Ошибка при создании карточки');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка модуля..." />;
  }

  if (error || !module) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/" className="text-primary-600 hover:underline text-sm">← Назад к модулям</Link>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Модуль не найден'}</p>
          <Link to="/" className="text-primary-600 hover:underline mt-2 inline-block">
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

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
                🃏 {module.cards_count} карточек
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

      {/* Режимы обучения */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Flashcards */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2 text-2xl">🎴</span> Flashcards
          </h2>
          
          {studyCard ? (
            <div className="text-center">
              <Flashcard card={studyCard} isFlipped={isFlipped} onFlip={handleFlip} />
              
              {isFlipped && (
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => handleResult(false)}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    ❌ Не знаю
                  </button>
                  <button
                    onClick={() => handleResult(true)}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    ✅ Знаю
                  </button>
                </div>
              )}
              
              {!isFlipped && (
                <button
                  onClick={handleFlip}
                  className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Перевернуть
                </button>
              )}
              
              {studyProgress && (
                <p className="text-gray-500 text-sm mt-4">
                  Прогресс: {studyProgress.reviewed} / {studyProgress.total}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">📖</span>
              <p className="text-gray-600 mb-4">Начните изучение слов</p>
              <button
                onClick={loadStudyCard}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Начать изучение
              </button>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="space-y-4">
          <Link
            to={`/module/${id}/quiz`}
            className="block bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">📝 Пройти тест</h3>
                <p className="text-green-100 text-sm mt-1">Проверьте свои знания</p>
              </div>
              <span className="text-3xl">→</span>
            </div>
          </Link>

          <Link
            to={`/module/${id}/review`}
            className="block bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">⚠️ Работа над ошибками</h3>
                <p className="text-yellow-100 text-sm mt-1">Повторите сложные слова</p>
              </div>
              <span className="text-3xl">→</span>
            </div>
          </Link>

          <button
            onClick={() => setShowAddCard(!showAddCard)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">➕ Добавить карточку</h3>
                <p className="text-blue-100 text-sm mt-1">Создайте новую карточку</p>
              </div>
              <span className="text-3xl">{showAddCard ? '−' : '+'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Форма добавления карточки */}
      {showAddCard && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Новая карточка</h3>
          <form onSubmit={handleAddCard} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Термин (слово на английском) *
              </label>
              <input
                type="text"
                value={newCard.term}
                onChange={(e) => setNewCard({ ...newCard, term: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Apple"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Определение (перевод) *
              </label>
              <input
                type="text"
                value={newCard.definition}
                onChange={(e) => setNewCard({ ...newCard, definition: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Яблоко"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setShowAddCard(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список карточек */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="mr-2 text-2xl">📋</span> Все карточки
          </h2>
          <span className="text-sm text-gray-500">
            {module.cards ? module.cards.length : 0} шт.
          </span>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-3">
          {module.cards && module.cards.length > 0 ? (
            module.cards.map((card) => (
              <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="font-semibold text-gray-900 text-lg">{card.term}</p>
                      <span className="text-gray-400">→</span>
                      <p className="text-gray-700 text-lg">{card.definition}</p>
                    </div>
                    {card.example && (
                      <p className="text-gray-500 text-sm mt-2 italic">"{card.example}"</p>
                    )}
                  </div>
                  {card.success_rate !== null && (
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      card.success_rate >= 70 ? 'bg-green-100 text-green-700' :
                      card.success_rate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(card.success_rate)}%
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">📝</span>
              <p className="text-gray-600 mb-4">В этом модуле пока нет карточек</p>
              <button
                onClick={() => setShowAddCard(true)}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Добавить первую карточку
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModulePage;
