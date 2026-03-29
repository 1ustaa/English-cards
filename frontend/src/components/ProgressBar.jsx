/**
 * Компонент прогресс-бара
 */
const ProgressBar = ({ current, total, progress }) => {
  return (
    <div>
      {/* Progress bar */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-600 text-white text-xs font-bold rounded-full">
            {current}
          </span>
          <span>Вопрос</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Всего</span>
          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-300 text-gray-700 text-xs font-bold rounded-full">
            {total}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
