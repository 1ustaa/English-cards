import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { startStudySession, checkAnswer, getHint, finishStudySession } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';
import MultipleChoiceQuestion from '../components/MultipleChoiceQuestion';
import TextInputQuestion from '../components/TextInputQuestion';
import ResultsScreen from '../components/ResultsScreen';

const StudySession = () => {
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  
  // Для текущего вопроса
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hint, setHint] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState(null); // { isCorrect: boolean, correctAnswer: string }

  useEffect(() => {
    startSession();
    
    // Слушаем событие Enter для проверки ответа
    const handleEnterKey = () => {
      if (!feedback) {
        handleCheckAnswer();
      }
    };
    
    window.addEventListener('checkAnswer', handleEnterKey);
    return () => window.removeEventListener('checkAnswer', handleEnterKey);
  }, [id]);

  const startSession = async () => {
    try {
      setLoading(true);
      const data = await startStudySession(id);
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));
    } catch (err) {
      console.error('Error starting session:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleCheckAnswer = async () => {
    if (!currentQuestion) return;
    
    const answer = currentQuestion.type === 'multiple_choice' ? selectedAnswer : textAnswer;
    if (!answer) {
      return;
    }

    try {
      setIsChecking(true);
      const data = await checkAnswer(sessionId, currentQuestion.questionId, answer);
      setFeedback(data);
      
      // Сохраняем ответ
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = {
        questionId: currentQuestion.questionId,
        answer: answer,
        isCorrect: data.isCorrect,
      };
      setAnswers(newAnswers);
    } catch (err) {
      console.error('Error checking answer:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setSelectedAnswer(null);
    setTextAnswer('');
    setShowHint(false);
    setHint(null);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishSession();
    }
  };

  const handleSkip = () => {
    // Пропускаем вопрос, считаем неправильным
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.questionId,
      answer: null,
      isCorrect: false,
      skipped: true,
    };
    setAnswers(newAnswers);
    handleNextQuestion();
  };

  const handleRestart = () => {
    // Сбрасываем все состояния
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setIsFinished(false);
    setFeedback(null);
    setSelectedAnswer(null);
    setTextAnswer('');
    setShowHint(false);
    setHint(null);
    
    // Начинаем новую сессию
    startSession();
  };

  const handleGetHint = async () => {
    try {
      const data = await getHint(sessionId, currentQuestion.questionId);
      setHint(data);
      setShowHint(true);
    } catch (err) {
      console.error('Error getting hint:', err);
    }
  };

  const finishSession = async () => {
    try {
      const data = await finishStudySession(sessionId);
      setIsFinished(true);
      setAnswers(data.answers);
    } catch (err) {
      console.error('Error finishing session:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка сессии..." />;
  }

  if (isFinished) {
    const correct = answers.filter(a => a?.isCorrect).length;
    const total = questions.length;
    return (
      <ResultsScreen
        correct={correct}
        total={total}
        answers={answers}
        onRestart={handleRestart}
        moduleId={id}
      />
    );
  }

  if (!currentQuestion) {
    return <LoadingSpinner text="Загрузка вопроса..." />;
  }

  const progress = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to={`/module/${id}`} className="text-primary-600 hover:underline text-sm">
            ← Назад к модулю
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={questions.length}
          progress={progress}
        />
      </div>

      {/* Question Card */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentQuestion.type === 'multiple_choice' ? (
            <MultipleChoiceQuestion
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={setSelectedAnswer}
              feedback={feedback}
            />
          ) : (
            <TextInputQuestion
              question={currentQuestion}
              textAnswer={textAnswer}
              onTextAnswer={setTextAnswer}
              feedback={feedback}
              showHint={showHint}
              hint={hint}
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              {currentQuestion.type === 'text_input' && !showHint && (
                <button
                  onClick={handleGetHint}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  💡 Подсказка
                </button>
              )}
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
              Пропустить
              </button>
            </div>

            {!feedback ? (
              <button
                onClick={handleCheckAnswer}
                disabled={isChecking || (currentQuestion.type === 'multiple_choice' ? !selectedAnswer : !textAnswer)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? 'Проверка...' : 'Ответить'}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Следующий вопрос →' : 'Завершить'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySession;
