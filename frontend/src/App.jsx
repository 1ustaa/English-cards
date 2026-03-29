import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ModulesPage from './pages/ModulesPage';
import ModulePage from './pages/ModulePage';
import CreateModulePage from './pages/CreateModulePage';
import QuizPage from './pages/QuizPage';
import StudyPage from './pages/StudyPage';
import EditCardsPage from './pages/EditCardsPage';
import StudySession from './pages/StudySession';

function App() {
  return (
    <Router>
      <Routes>
        {/* Страница модуля - без Header, на весь экран */}
        <Route path="/module/:id" element={<ModulePage />} />
        
        {/* Главная страница - список модулей */}
        <Route path="/" element={
          <>
            <Header />
            <ModulesPage />
          </>
        } />
        
        {/* Создание модуля */}
        <Route path="/create" element={
          <>
            <Header />
            <CreateModulePage />
          </>
        } />
        
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
      </Routes>
    </Router>
  );
}

export default App;
