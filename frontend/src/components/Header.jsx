import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path
      ? 'text-primary-600 font-semibold bg-primary-50 px-3 py-2 rounded-md'
      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors';
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold text-gray-900">Qardly</span>
          </Link>

          {/* Навигация и пользователь */}
          <nav className="flex items-center space-x-6">
            <Link to="/" className={isActive('/')}>
              Модули
            </Link>

            {user && (
              <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
                <span className="text-sm text-gray-700 font-medium">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors"
                >
                  Выйти
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
