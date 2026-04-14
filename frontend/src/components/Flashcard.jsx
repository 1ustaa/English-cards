/**
 * Компонент карточки для режима Flashcards
 */
const Flashcard = ({ card, isFlipped, onFlip }) => {
  if (!card) return null;

  return (
    <div
      className="flip-card w-full max-w-md h-56 sm:h-64 cursor-pointer"
      onClick={onFlip}
    >
      <div className={`flip-card-inner relative w-full h-full ${isFlipped ? 'flipped' : ''}`}>
        {/* Лицевая сторона (Термин) */}
        <div className="flip-card-front bg-white rounded-xl shadow-lg p-4 sm:p-8 flex flex-col items-center justify-center border-2 border-gray-200">
          <span className="text-xs sm:text-sm text-gray-500 mb-2">Термин</span>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center px-2 break-words">{card.term}</h3>
          {card.example && (
            <p className="text-gray-600 mt-2 sm:mt-4 text-center italic text-sm sm:text-base px-2">"{card.example}"</p>
          )}
          <p className="text-gray-400 text-xs sm:text-sm mt-4 sm:mt-6">Нажмите чтобы перевернуть</p>
        </div>

        {/* Обратная сторона (Определение) */}
        <div className="flip-card-back bg-primary-600 rounded-xl shadow-lg p-4 sm:p-8 flex flex-col items-center justify-center text-white">
          <span className="text-xs sm:text-sm text-primary-200 mb-2">Перевод</span>
          <h3 className="text-xl sm:text-2xl font-bold text-center px-2 break-words">{card.definition}</h3>
          {card.example && (
            <p className="text-primary-100 mt-2 sm:mt-4 text-center italic text-sm sm:text-base px-2">"{card.example}"</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
