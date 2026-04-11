/**
 * Компонент вопроса с ручным вводом
 */
const TextInputQuestion = ({ question, textAnswer, onTextAnswer, feedback, showHint, hint, onCheckAnswer }) => {
  // Обработка клавиши Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !feedback && textAnswer.trim() && onCheckAnswer) {
      e.preventDefault();
      onCheckAnswer();
    }
  };
  return (
    <div>
      {/* Question */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm text-gray-500 uppercase tracking-wide">ОПРЕДЕЛЕНИЕ</p>
          <button className="text-gray-400 hover:text-primary-600 transition-colors" title="Произнести">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 11H2a1 1 0 01-1-1V6a1 1 0 011-1h2.586l3.707-5.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">{question.definition}</h2>
      </div>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ваш ответ
        </label>
        <input
          type="text"
          value={textAnswer}
          onChange={(e) => onTextAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!!feedback}
          placeholder="Введите термин..."
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all disabled:bg-gray-100 text-lg"
          autoFocus
        />
        
        {/* Hint */}
        {showHint && hint && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Подсказка:</span>
            </p>
            <p className="text-2xl font-mono mt-2 text-yellow-900 font-bold tracking-wider">
              {hint.hintDisplay}
            </p>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mt-6 p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`font-medium ${feedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {feedback.isCorrect ? '✅ Правильно!' : `❌ Неправильно. Правильный ответ: ${feedback.correctAnswer}`}
          </p>
          {!feedback.isCorrect && textAnswer && (
            <p className="text-sm text-red-600 mt-2">
              Ваш ответ: <span className="font-medium">{textAnswer}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TextInputQuestion;
