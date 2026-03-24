import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Компонент карточки модуля в списке
 */
const ModuleCard = ({ module }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  // Закрыть меню при клике вне его
  const closeMenu = () => setShowMenu(false);

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 relative"
      onClick={closeMenu}
    >
      {/* Заголовок с цветом */}
      <div className={`h-2 ${module.is_public ? 'bg-green-500' : 'bg-gray-500'}`} />
      
      <div className="p-6">
        {/* Кнопка меню (три точки) */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={handleMenuClick}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Действия"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Контекстное меню */}
          {showMenu && (
            <>
              {/* Фон для закрытия при клике */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={closeMenu}
              />
              
              {/* Меню */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl z-20 border border-gray-200">
                <div className="py-1">
                  <Link
                    to={`/module/${module.id}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={closeMenu}
                  >
                    📖 Открыть модуль
                  </Link>
                  <Link
                    to={`/module/${module.id}/edit`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={closeMenu}
                  >
                    ✏️ Редактировать карточки
                  </Link>
                  <Link
                    to={`/module/${module.id}/study`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={closeMenu}
                  >
                    🎴 Учить
                  </Link>
                  <Link
                    to={`/module/${module.id}/quiz`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={closeMenu}
                  >
                    📝 Пройти тест
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Название и описание */}
        <Link to={`/module/${module.id}`} className="block pr-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
            {module.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {module.description || 'Нет описания'}
          </p>
        </Link>

        {/* Мета информация */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <span className="mr-1">🃏</span>
              {module.cards_count} карточек
            </span>
            {module.owner_username && (
              <span className="flex items-center">
                <span className="mr-1">👤</span>
                {module.owner_username}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleCard;
