import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import ModulesPage from './pages/ModulesPage';
import ModulePage from './pages/ModulePage';
import CreateModulePage from './pages/CreateModulePage';
import QuizPage from './pages/QuizPage';
import StudyPage from './pages/StudyPage';
import EditCardsPage from './pages/EditCardsPage';
import StudySession from './pages/StudySession';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Публичные страницы - Login и Register */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Главная страница - список модулей (защищена) */}
          <Route path="/" element={
            <ProtectedRoute>
              <Header />
              <ModulesPage />
            </ProtectedRoute>
          } />

          {/* Создание модуля (защищена) */}
          <Route path="/create-module" element={
            <ProtectedRoute>
              <Header />
              <CreateModulePage />
            </ProtectedRoute>
          } />

          {/* Страница модуля - без Header, на весь экран (защищена) */}
          <Route path="/module/:id" element={
            <ProtectedRoute>
              <ModulePage />
            </ProtectedRoute>
          } />

          {/* Редактирование карточек (защищена) */}
          <Route path="/module/:id/edit" element={
            <ProtectedRoute>
              <Header />
              <EditCardsPage />
            </ProtectedRoute>
          } />

          {/* Страница обучения (Flashcards) (защищена) */}
          <Route path="/module/:id/study" element={
            <ProtectedRoute>
              <Header />
              <StudyPage />
            </ProtectedRoute>
          } />

          {/* Заучивание (Study Session) (защищена) */}
          <Route path="/module/:id/study-session" element={
            <ProtectedRoute>
              <StudySession />
            </ProtectedRoute>
          } />

          {/* Тест (Quiz) (защищена) */}
          <Route path="/module/:id/quiz" element={
            <ProtectedRoute>
              <Header />
              <QuizPage />
            </ProtectedRoute>
          } />

          {/* 404 - Страница не найдена */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
