import { useEffect } from 'react';

/**
 * Компонент вопроса с выбором варианта
 */
const MultipleChoiceQuestion = ({ question, selectedAnswer, onSelectAnswer, feedback, onCheckAnswer }) => {
  // Обработка клавиш для Multiple Choice
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (feedback) return; // Если уже есть обратная связь, игнорируем
      
      if (e.key === 'Enter' && selectedAnswer && onCheckAnswer) {
        e.preventDefault();
        onCheckAnswer();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnswer, feedback, onCheckAnswer]);
  return (
    <div>
      {/* Question */}
      <div className="mb-4 sm:mb-8">
        <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-2">ТЕРМИН</p>
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">{question.term}</h2>
      </div>

      {/* Options */}
      <div className="space-y-2 sm:space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = feedback && option === feedback.correctAnswer;
          const isWrong = feedback && isSelected && !isCorrect;

          let buttonClass = 'border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50';

          if (feedback) {
            if (isCorrect) {
              buttonClass = 'border-2 border-green-500 bg-green-50';
            } else if (isWrong) {
              buttonClass = 'border-2 border-red-500 bg-red-50';
            }
          } else if (isSelected) {
            buttonClass = 'border-2 border-primary-500 bg-primary-50';
          }

          return (
            <button
              key={index}
              onClick={() => !feedback && onSelectAnswer(option)}
              disabled={!!feedback}
              className={`w-full p-3 sm:p-4 rounded-xl text-left transition-all text-sm sm:text-base ${buttonClass} disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{option}</span>
                {isCorrect && <span className="text-green-600 text-lg sm:text-xl">✅</span>}
                {isWrong && <span className="text-red-600 text-lg sm:text-xl">❌</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mt-6 p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`font-medium ${feedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {feedback.isCorrect ? '✅ Правильно!' : `❌ Неправильно. Правильный ответ: ${feedback.correctAnswer}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceQuestion;
