import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path 
      ? 'text-primary-600 font-semibold bg-primary-50 px-3 py-2 rounded-md' 
      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors';
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <span className="text-3xl">📚</span>
            <div>
              <span className="text-xl font-bold text-gray-900">English Cards</span>
              <p className="text-xs text-gray-500 -mt-1">Изучение слов</p>
            </div>
          </Link>

          {/* Навигация */}
          <nav className="flex items-center space-x-2">
            <Link to="/" className={isActive('/')}>
              📋 Модули
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
