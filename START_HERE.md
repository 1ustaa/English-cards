# 🚀 Памятка по запуску приложения English Cards

## 📋 Требования

- **Python 3.13+**
- **Node.js 18+**
- **npm** (устанавливается вместе с Node.js)

---

## 🔧 Первая установка

### 1. Установите зависимости Python

```bash
cd "c:\Users\serge\Desktop\Code\Projects\English cards"
pip install -r requirements.txt
```

### 2. Установите зависимости Node.js

```bash
cd "c:\Users\serge\Desktop\Code\Projects\English cards\frontend"
npm install
```

### 3. Инициализируйте базу данных

```bash
cd "c:\Users\serge\Desktop\Code\Projects\English cards"
python init_db.py
```

---

## ▶️ Запуск приложения

### Вариант 1: Два терминала

**Терминал 1 — Backend (Flask):**
```bash
cd "c:\Users\serge\Desktop\Code\Projects\English cards"
python wsgi.py
```

**Терминал 2 — Frontend (Vite + React):**
```bash
cd "c:\Users\serge\Desktop\Code\Projects\English cards\frontend"
npm run dev
```

### Вариант 2: Один скрипт (если есть)

```bash
# Создайте файл start.bat в корне проекта
@echo off
start "" python wsgi.py
timeout /t 3 /nobreak >nul
start "" cmd /k "cd frontend && npm run dev"
```

---

## 🌐 Доступ к приложению

| Сервер | URL | Назначение |
|--------|-----|------------|
| **Frontend** | http://localhost:3000 | **Основное приложение** |
| Backend API | http://127.0.0.1:5000 | Только для тестов |
| Health check | http://127.0.0.1:5000/health | Проверка работы |

---

## 🛑 Остановка серверов

### Windows:

**В терминале:**
```
Ctrl + C
```

**Или закройте окна терминала**

**Принудительная остановка:**
```bash
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```

---

## 🐛 Решение проблем

### Frontend не запускается

**Ошибка: `npm` не найдено**
```bash
# Установите Node.js с https://nodejs.org/
```

**Ошибка: `VITE` не найден**
```bash
cd frontend
npm install
```

### Backend не запускается

**Ошибка: `flask` не найден**
```bash
pip install -r requirements.txt
```

**Ошибка: `sqlite3` не работает**
```bash
# Для Python 3.13 на Windows используйте in-memory БД
# (уже настроено в config.py)
```

### Приложение не открывается

1. **Проверьте что оба сервера запущены**
2. **Очистите кэш браузера:** `Ctrl + Shift + R`
3. **Проверьте порты:** 
   - Frontend: порт 3000
   - Backend: порт 5000

---

## 📁 Структура проекта

```
english-cards/
├── app/                    # Backend (Flask)
│   ├── api/               # API endpoints
│   ├── models.py          # Модели данных
│   └── __init__.py        # Factory приложения
├── frontend/              # Frontend (React + Vite)
│   ├── src/              # Исходный код
│   └── public/           # Статические файлы
├── instance/             # База данных (SQLite)
├── init_db.py           # Скрипт инициализации БД
├── wsgi.py              # Точка входа Backend
├── requirements.txt     # Зависимости Python
└── START_HERE.md        # Этот файл
```

---

## 🎯 Быстрый старт

```bash
# 1. Откройте два терминала

# Терминал 1
cd "c:\Users\serge\Desktop\Code\Projects\English cards"
python wsgi.py

# Терминал 2
cd "c:\Users\serge\Desktop\Code\Projects\English cards\frontend"
npm run dev

# 2. Откройте браузер
http://localhost:3000
```

---

## 📝 Тестовые данные

После инициализации создаются:

- **Пользователь:** `testuser`
- **Модуль:** "English Basics" (5 карточек)
  - Apple → Яблоко
  - Book → Книга
  - Cat → Кошка
  - Dog → Собака
  - Elephant → Слон

---

## 🔑 Полезные команды

### Backend:

```bash
# Запуск с отладкой
python wsgi.py

# Инициализация БД
python init_db.py

# Инициализация с тестовыми данными
python init_db.py --seed
```

### Frontend:

```bash
# Запуск dev сервера
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр сборки
npm run preview
```

---

## 📞 Если что-то пошло не так

1. **Перезапустите оба сервера**
2. **Проверьте консоль на ошибки**
3. **Очистите кэш браузера** (`Ctrl+Shift+R`)
4. **Проверьте что порты не заняты**

---

**Приятной разработки!** 🎉
