import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { getModule, updateCard, createCard, deleteCard } from '../services/api';

const EditCardsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [module, setModule] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [deletedCards, setDeletedCards] = useState([]); // ID карточек на удаление

  useEffect(() => {
    loadModule();
    
    // Отслеживаем прокрутку
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Показываем кнопку вниз если контент не помещается и мы вверху
      const hasOverflow = documentHeight > windowHeight + 100;
      const shouldShowDown = scrollTop < 100 && hasOverflow;
      
      // Показываем кнопку вверх если прокрутили вниз
      const shouldShowUp = scrollTop > 300;
      
      setShowScrollDown(shouldShowDown);
      setShowScrollUp(shouldShowUp);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Принудительно проверяем через 1 секунду
    setTimeout(() => {
      const hasOverflow = document.documentElement.scrollHeight > window.innerHeight + 100;
      console.log('Has overflow:', hasOverflow, 'Scroll height:', document.documentElement.scrollHeight, 'Window:', window.innerHeight);
      if (hasOverflow) {
        setShowScrollDown(true);
      }
    }, 1000);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  const loadModule = async () => {
    try {
      setLoading(true);
      const data = await getModule(id);
      setModule(data);
      setCards(data.cards || []);
    } catch (err) {
      toast.error('Не удалось загрузить модуль');
      console.error('Error loading module:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (cardId, field, value) => {
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, [field]: value } : card
    ));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      let successCount = 0;
      let errorCount = 0;

      // Сначала удаляем помеченные карточки
      for (const cardId of deletedCards) {
        try {
          await deleteCard(cardId);
          successCount++;
        } catch (err) {
          errorCount++;
          console.error('Error deleting card:', err);
        }
      }

      // Затем сохраняем все карточки (кроме удаленных)
      const cardsToSave = cards.filter(c => !deletedCards.includes(c.id));
      for (const card of cardsToSave) {
        try {
          if (card.isNew) {
            await createCard({
              module_id: parseInt(id),
              term: card.term || '',
              definition: card.definition || '',
              example: card.example || '',
            });
          } else {
            await updateCard(card.id, {
              term: card.term || '',
              definition: card.definition || '',
              example: card.example || '',
            });
          }
          successCount++;
        } catch (err) {
          errorCount++;
          console.error('Error saving card:', err);
        }
      }

      // Очищаем список удаленных и перезагружаем данные
      setDeletedCards([]);
      await loadModule();
      
      if (successCount > 0) {
        toast.success(`Сохранено ${successCount} карточек`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} карточек не сохранено`);
      }
    } catch (err) {
      toast.error('Ошибка при сохранении');
      console.error('Error saving all cards:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = (cardId) => {
    // Если карточка новая (еще не сохранена), просто удаляем из списка
    if (cardId.toString().startsWith('new-')) {
      setCards(prev => prev.filter(c => c.id !== cardId));
      toast.success('Карточка удалена');
      return;
    }

    // Для сохраненных карточек - помечаем на удаление
    setDeletedCards(prev => [...prev, cardId]);
    toast.success('Карточка будет удалена после сохранения');
  };

  const handleAddCard = () => {
    const newCard = {
      id: `new-${Date.now()}`,
      term: '',
      definition: '',
      example: '',
      isNew: true,
    };
    setCards(prev => [...prev, newCard]);
    
    // Прокрутка к новой карточке
    setTimeout(() => {
      const element = document.getElementById(`card-${newCard.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка карточек..." />;
  }

  if (!module) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to={`/module/${id}`} className="text-primary-600 hover:underline text-sm">
          ← Назад к модулю
        </Link>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Не удалось загрузить модуль</p>
          <button
            onClick={loadModule}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
      {/* Заголовок */}
      <div className="mb-4 sm:mb-6">
        <Link to={`/module/${id}`} className="text-primary-600 hover:underline text-sm">
          ← Назад к модулю
        </Link>
        <div className="mt-3 sm:mt-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Редактирование карточек</h1>
          <p className="text-sm text-gray-600 mt-1">
            {module.title} • {cards.length} карточек
          </p>
        </div>
      </div>

      {/* Список карточек */}
      <div className="space-y-4">
        {cards.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <span className="text-6xl mb-4 block">📝</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет карточек</h3>
            <p className="text-gray-600 mb-6">Добавьте первую карточку</p>
            <button
              onClick={handleAddCard}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <span className="text-xl mr-1">+</span>
              Добавить карточку
            </button>
          </div>
        ) : (
          cards.map((card, index) => (
            <div
              id={`card-${card.id}`}
              key={card.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                card.isNew ? 'border-green-500' : 
                deletedCards.includes(card.id) ? 'border-red-500 opacity-50' : 
                'border-gray-300'
              }`}
            >
              {/* Номер карточки */}
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-gray-500">
                  Карточка #{index + 1}
                  {card.isNew && <span className="ml-2 text-green-600">(новая)</span>}
                  {deletedCards.includes(card.id) && <span className="ml-2 text-red-600">(будет удалена)</span>}
                </span>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="flex items-center px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
                >
                  <span className="mr-1">🗑️</span>
                  Удалить
                </button>
              </div>

              {/* Поля ввода */}
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Термин
                  </label>
                  <input
                    type="text"
                    value={card.term}
                    onChange={(e) => handleCardChange(card.id, 'term', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Apple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Определение
                  </label>
                  <input
                    type="text"
                    value={card.definition}
                    onChange={(e) => handleCardChange(card.id, 'definition', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Яблоко"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Кнопка добавления внизу */}
      {cards.length > 0 && (
        <div className="mt-6 sm:mt-8 mb-20 sm:mb-24 text-center">
          <button
            onClick={handleAddCard}
            className="bg-green-600 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium inline-flex items-center"
          >
            <span className="text-xl sm:text-2xl mr-2">+</span>
            Добавить карточку
          </button>
        </div>
      )}

      {/* Фиксированная кнопка "Сохранить все" внизу - видна всегда */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-3 sm:p-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full bg-blue-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-lg font-medium flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '⏳ Сохранение...' : '💾 Сохранить все'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCardsPage;
