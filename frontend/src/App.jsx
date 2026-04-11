import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ModulesPage from './pages/ModulesPage';
import ModulePage from './pages/ModulePage';
import CreateModulePage from './pages/CreateModulePage';
import QuizPage from './pages/QuizPage';
import StudyPage from './pages/StudyPage';
import EditCardsPage from './pages/EditCardsPage';
import StudySession from './pages/StudySession';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Главная страница - список модулей */}
        <Route path="/" element={
          <>
            <Header />
            <ModulesPage />
          </>
        } />

        {/* Создание модуля */}
        <Route path="/create-module" element={
          <>
            <Header />
            <CreateModulePage />
          </>
        } />

        {/* Страница модуля - без Header, на весь экран */}
        <Route path="/module/:id" element={<ModulePage />} />

        {/* Редактирование карточек */}
        <Route path="/module/:id/edit" element={
          <>
            <Header />
            <EditCardsPage />
          </>
        } />

        {/* Страница обучения (Flashcards) */}
        <Route path="/module/:id/study" element={
          <>
            <Header />
            <StudyPage />
          </>
        } />

        {/* Заучивание (Study Session) */}
        <Route path="/module/:id/study-session" element={<StudySession />} />

        {/* Тест (Quiz) */}
        <Route path="/module/:id/quiz" element={
          <>
            <Header />
            <QuizPage />
          </>
        } />

        {/* 404 - Страница не найдена */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
