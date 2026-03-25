import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { getQuizData, recordResult } from '../services/api';

const QuizPage = () => {
  const { id } = useParams();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleExists, setModuleExists] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getQuizData(id);
      
      // Проверяем есть ли ошибка в ответе
      if (data.error) {
        // Если модуль не найден, показываем понятную ошибку
        if (data.error === 'Not Found' || data.error.includes('404')) {
          setError(`Модуль не найден. Возможно, он был удалён.`);
          setModuleExists(false);
        } else {
          setError(data.error);
        }
        setQuizData(null);
      } else {
        setQuizData(data);
        setModuleExists(true);
      }
    } catch (err) {
      setError('Не удалось загрузить тест. Проверьте подключение к серверу.');
      console.error('Error loading quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (cardId) => {
    if (selectedAnswer !== null) return; // Уже выбран ответ
    
    setSelectedAnswer(cardId);
    const correct = cardId === quizData.correct_answer;
    setIsCorrect(correct);
    
    // Записываем результат
    try {
      await recordResult(quizData.question.card_id, correct);
    } catch (err) {
      console.error('Error recording result:', err);
    }

    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    // Загружаем следующий вопрос через 1.5 секунды
    setTimeout(() => {
      if (score.total + 1 >= 10) { // После 10 вопросов завершаем
        setFinished(true);
      } else {
        loadQuiz();
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
    }, 1500);
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка теста..." />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки теста</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col space-y-3 justify-center">
            <Link
              to="/"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
            >
              📋 К списку модулей
            </Link>
            {moduleExists && (
              <Link
                to={`/module/${id}/edit`}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
              >
                ➕ Добавить карточки
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <span className="text-6xl mb-4 block">❌</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Тест недоступен</h1>
          <Link
            to={`/module/${id}`}
            className="text-primary-600 hover:underline"
          >
            Вернуться к модулю
          </Link>
        </div>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <span className="text-6xl mb-4 block">
            {percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '📚'}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Тест завершен!</h1>
          <p className="text-xl text-gray-600 mb-6">
            Ваш результат: <span className="font-bold text-primary-600">{score.correct}</span> из <span className="font-bold">{score.total}</span>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
            <div 
              className={`h-4 rounded-full transition-all ${
                percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-gray-600 mb-8">
            {percentage >= 80 ? 'Отличный результат!' : percentage >= 50 ? 'Хорошо, но можно лучше!' : 'Продолжайте учиться!'}
          </p>
          <div className="flex space-x-4 justify-center">
            <Link
              to={`/module/${id}`}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Вернуться к модулю
            </Link>
            <button
              onClick={() => {
                setFinished(false);
                setScore({ correct: 0, total: 0 });
                loadQuiz();
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Пройти заново
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Не удалось загрузить тест</p>
          <Link to={`/module/${id}`} className="text-primary-600 hover:underline mt-2 inline-block">
            Вернуться к модулю
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Прогресс */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Вопрос {score.total + 1}</span>
          <span>Правильно: {score.correct}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 bg-primary-600 rounded-full transition-all"
            style={{ width: `${Math.min((score.total / 10) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Вопрос */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <p className="text-sm text-gray-500 mb-2">Переведите слово:</p>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          {quizData.question.term}
        </h2>
        {quizData.question.example && (
          <p className="text-gray-600 text-center italic">"{quizData.question.example}"</p>
        )}
      </div>

      {/* Варианты ответов */}
      <div className="space-y-3">
        {quizData.options.map((option) => {
          let buttonClass = 'bg-white border-2 border-gray-200 hover:border-primary-300';
          
          if (selectedAnswer !== null) {
            if (option.card_id === quizData.correct_answer) {
              buttonClass = 'bg-green-100 border-2 border-green-500';
            } else if (option.card_id === selectedAnswer) {
              buttonClass = 'bg-red-100 border-2 border-red-500';
            }
          }

          return (
            <button
              key={option.card_id}
              onClick={() => handleAnswer(option.card_id)}
              disabled={selectedAnswer !== null}
              className={`w-full p-4 rounded-lg text-left transition-all ${buttonClass} ${
                selectedAnswer === null ? 'hover:shadow-md' : ''
              } disabled:cursor-not-allowed`}
            >
              <span className="font-medium text-gray-900">{option.definition}</span>
              {selectedAnswer !== null && option.card_id === quizData.correct_answer && (
                <span className="float-right text-green-600">✅</span>
              )}
              {selectedAnswer === option.card_id && option.card_id !== quizData.correct_answer && (
                <span className="float-right text-red-600">❌</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Кнопка назад */}
      <div className="mt-8 text-center">
        <Link
          to={`/module/${id}`}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Закончить тест
        </Link>
      </div>
    </div>
  );
};

export default QuizPage;
