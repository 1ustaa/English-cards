import { Link } from 'react-router-dom';

/**
 * Экран результатов сессии
 */
const ResultsScreen = ({ correct, total, _answers, onRestart, moduleId }) => {
  const percentage = Math.round((correct / total) * 100);
  
  let message = '';
  let emoji = '';
  
  if (percentage >= 90) {
    emoji = '🏆';
    message = 'Превосходно!';
  } else if (percentage >= 70) {
    emoji = '👍';
    message = 'Хороший результат!';
  } else if (percentage >= 50) {
    emoji = '📚';
    message = 'Можно лучше';
  } else {
    emoji = '⚠️';
    message = 'Попробуйте ещё раз';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-7xl mb-4 block">{emoji}</span>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Сессия завершена!</h1>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Results */}
        <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-xl p-6 mb-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary-600 mb-2">
              {correct} из {total}
            </p>
            <p className="text-2xl font-bold text-green-600 mb-4">
              {percentage}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{correct}</p>
            <p className="text-sm text-green-700">✅ Правильно</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{total - correct}</p>
            <p className="text-sm text-red-700">❌ Ошибки</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-bold text-lg shadow-lg"
          >
            🔄 Начать заново
          </button>
          <Link
            to={`/module/${moduleId}`}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-bold text-lg text-center shadow-lg"
          >
            📋 К модулю
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
