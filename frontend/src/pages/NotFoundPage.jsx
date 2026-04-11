import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center max-w-md">
        {/* Иконка */}
        <div className="text-9xl font-bold text-gray-200 mb-4">404</div>
        
        {/* Сообщение */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Страница не найдена</h1>
        <p className="text-gray-600 mb-8">
          Запрашиваемая страница не существует или была удалена
        </p>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium shadow-md hover:shadow-lg"
          >
            На главную
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
