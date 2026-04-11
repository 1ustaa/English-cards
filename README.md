# 📚 English Cards - Приложение для изучения английского языка

## 🎯 Описание

Веб-приложение для изучения иностранных слов с функциями:
- Создание и управление модулями (деками)
- Карточки с термином, определением и примером
- Режим обучения (Flashcards)
- Режим заучивания с проверкой знаний
- Тесты с вариантами ответов
- Работа над ошибками
- Импорт карточек из CSV
- Публичные и личные модули
- Система клонирования модулей

---

## 🏗️ Архитектура

### Backend
- **Framework:** Flask 3.0.0
- **ORM:** SQLAlchemy 2.0+
- **Миграции:** Alembic (Flask-Migrate)
- **База данных:** PostgreSQL (production)
- **API:** RESTful JSON API

### Frontend
- **Framework:** React 19 + Vite 8
- **Стили:** Tailwind CSS 4
- **HTTP клиент:** Axios
- **Роутинг:** React Router DOM

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

**Backend:**
```bash
cd "c:\Users\serge\Desktop\Code\Projects\English cards"
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Настройка базы данных

**Создайте базу данных PostgreSQL:**
```sql
CREATE DATABASE english_cards;
```

**Настройте `.env`:**
```env
FLASK_APP=wsgi.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/english_cards
```

**Примените миграции:**
```bash
flask db upgrade
```

**Добавьте тестовые данные (опционально):**
```bash
flask init-db --seed
```

### 3. Запуск приложения

**Терминал 1 - Backend:**
```bash
python wsgi.py
```

**Терминал 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Откройте приложение

```
http://localhost:5173
```

---

## 📊 База данных

### Модели

**User:**
- id, username, email, password_hash
- created_at, is_active

**Module:**
- id, title, description, user_id
- is_public, created_at, updated_at
- cloned_from_id

**Card:**
- id, module_id, term, definition, example
- error_count, success_count, last_reviewed
- created_at, updated_at

**StudyLog:**
- id, user_id, card_id, module_id
- result (success/fail), created_at

### Миграции

```bash
# Создать миграцию
python db.py migrate -m "Описание"

# Применить миграции
python db.py upgrade

# Откатить миграцию
python db.py downgrade -1

# Текущая версия
python db.py current

# История миграций
python db.py history
```

---

## 🔌 API Endpoints

### Модули
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/modules` | Список модулей |
| GET | `/api/v1/modules/<id>` | Детали модуля |
| POST | `/api/v1/modules` | Создать модуль |
| PUT | `/api/v1/modules/<id>` | Обновить модуль |
| DELETE | `/api/v1/modules/<id>` | Удалить модуль |
| POST | `/api/v1/modules/<id>/clone` | Клонировать модуль |
| POST | `/api/v1/modules/<id>/import` | Импорт CSV |
| GET | `/api/v1/modules/<id>/stats` | Статистика |

### Карточки
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/cards` | Список карточек |
| GET | `/api/v1/cards/<id>` | Детали карточки |
| POST | `/api/v1/cards` | Создать карточку |
| PUT | `/api/v1/cards/<id>` | Обновить карточку |
| DELETE | `/api/v1/cards/<id>` | Удалить карточку |

### Обучение
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/cards/study/<module_id>` | Карточка для изучения |
| POST | `/api/v1/cards/<id>/record` | Записать результат |
| GET | `/api/v1/cards/review/<module_id>` | Работа над ошибками |
| GET | `/api/v1/cards/quiz/<module_id>` | Тест с вариантами |
| POST | `/api/v1/modules/<id>/study-session` | Начать заучивание |
| POST | `/api/v1/modules/study-session/<id>/check` | Проверить ответ |
| GET | `/api/v1/modules/study-session/<id>/hint` | Подсказка |
| POST | `/api/v1/modules/study-session/<id>/finish` | Завершить сессию |

---

## 🎮 Режимы обучения

### 1. Flashcards
- Переворот карточки кликом
- Кнопки "Знаю" / "Не знаю"
- Статистика по каждой карточке

### 2. Заучивание (Study Session)
- 2× вопросов на каждую карточку
- Выбор варианта (термин → определение)
- Ручной ввод (определение → термин)
- Проверка с допуском опечаток (≤2 ошибки)
- Подсказки (половина слова)
- Пропуск вопросов
- Экран результатов

### 3. Тест (Quiz)
- 4 варианта ответа
- Адаптируется под количество карточек
- Подсчёт результатов

### 4. Работа над ошибками
- Карточки с высоким error_count
- Карточки с низким success_rate

---

## 🔧 Конфигурация

### .env

```env
# Flask
FLASK_APP=wsgi.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/english_cards

# CORS (для production укажите конкретные домены)
CORS_ORIGINS=*

# API
API_PREFIX=/api/v1
```

---

## 📝 Горячие клавиши

### Страница модуля
| Клавиша | Действие |
|---------|----------|
| ← | Предыдущая карточка |
| → | Следующая карточка |
| Пробел | Перевернуть карточку |

### Заучивание
| Клавиша | Действие |
|---------|----------|
| Enter | Ответить на вопрос |

---

## 📁 Структура проекта

```
english-cards/
├── app/                          # Backend (Flask)
│   ├── __init__.py              # Factory приложения
│   ├── config.py                # Конфигурация
│   ├── models.py                # SQLAlchemy модели
│   ├── extensions.py            # Расширения (db, ma, migrate)
│   ├── commands.py              # CLI команды
│   └── api/                     # API endpoints
│       ├── modules.py           # CRUD модулей + клонирование + CSV
│       └── cards.py             # CRUD карточек + обучение
├── frontend/                     # Frontend (React)
│   ├── src/
│   │   ├── components/          # React компоненты
│   │   ├── pages/               # Страницы
│   │   ├── services/            # API клиент
│   │   └── context/             # React контексты
│   └── package.json
├── migrations/                   # Alembic миграции
├── .env                         # Переменные окружения
├── .gitignore
├── db.py                        # Скрипт миграций
├── wsgi.py                      # Точка входа Backend
├── requirements.txt             # Python зависимости
├── README.md                    # Этот файл
└── PRODUCTION.md                # Production deployment guide
```

---

## 🐛 Решение проблем

### Frontend не запускается
```bash
cd frontend
npm install
npm run dev
```

### Backend не запускается
```bash
pip install -r requirements.txt
python wsgi.py
```

### Ошибки БД
```bash
# Проверить миграции
python db.py current

# Применить миграции
python db.py upgrade
```

### Ошибка подключения к PostgreSQL
1. Проверьте что PostgreSQL запущен
2. Проверьте пароль в `.env`
3. Убедитесь что база данных создана: `psql -U postgres -l`

---

## 🎯 Roadmap

### ✅ Реализовано
- [x] CRUD модулей
- [x] CRUD карточек
- [x] Импорт CSV
- [x] Клонирование модулей
- [x] Flashcards режим
- [x] Заучивание (Study Session)
- [x] Тест (Quiz)
- [x] Работа над ошибками
- [x] Статистика обучения
- [x] Миграции БД
- [x] Произношение слов (Web Speech API)
- [x] PostgreSQL поддержка
- [x] Валидация конфигурации
- [x] Страница 404

### 🔄 В планах
- [ ] Авторизация пользователей
- [ ] Группы студентов
- [ ] Прогресс обучения
- [ ] Мобильная версия
- [ ] PWA
- [ ] Экспорт в PDF
- [ ] Интеграция с API переводчика

---

## 📄 Лицензия

MIT

---

**Приятного изучения!** 🚀
