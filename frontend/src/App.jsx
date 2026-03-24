import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ModulesPage from './pages/ModulesPage';
import ModulePage from './pages/ModulePage';
import CreateModulePage from './pages/CreateModulePage';
import QuizPage from './pages/QuizPage';
import StudyPage from './pages/StudyPage';
import EditCardsPage from './pages/EditCardsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            {/* Главная страница - список модулей */}
            <Route path="/" element={<ModulesPage />} />
            
            {/* Создание модуля */}
            <Route path="/create" element={<CreateModulePage />} />
            
            {/* Страница модуля */}
            <Route path="/module/:id" element={<ModulePage />} />
            
            {/* Редактирование карточек */}
            <Route path="/module/:id/edit" element={<EditCardsPage />} />
            
            {/* Страница обучения (Flashcards) */}
            <Route path="/module/:id/study" element={<StudyPage />} />
            
            {/* Тест (Quiz) */}
            <Route path="/module/:id/quiz" element={<QuizPage />} />
            
            {/* 404 - Страница не найдена */}
            <Route path="*" element={
              <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h1 className="text-6xl mb-4">😕</h1>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Страница не найдена</h2>
                <p className="text-gray-600 mb-6">Запрашиваемая страница не существует</p>
                <a href="/" className="text-primary-600 hover:underline">
                  Вернуться на главную
                </a>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
