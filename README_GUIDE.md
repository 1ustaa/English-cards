# 📘 Руководство по приложению English Cards

## 📋 Содержание
1. [Архитектура приложения](#архитектура-приложения)
2. [Как работает Flask API](#как-работает-flask-api)
3. [Понимание путей (URL)](#понимание-путей-url)
4. [Что такое API и зачем нужен префикс /api/v1](#что-такое-api-и-зачем-нужен-префикс-apiv1)
5. [Как работает запрос-ответ](#как-работает-запрос-ответ)
6. [Готовый функционал](#готовый-функционал)
7. [Примеры использования API](#примеры-использования-api)
8. [Структура проекта](#структура-проекта)

---

## 🏗️ Архитектура приложения

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Браузер /     │  HTTP   │   Flask Server   │  SQL    │   SQLite /      │
│   React Frontend│ ──────> │   (Python)       │ ──────> │   PostgreSQL    │
│   (Клиент)      │ <────── │   (Бэкенд)       │ <────── │   (База данных) │
└─────────────────┘   JSON  └──────────────────┘  Данные └─────────────────┘
```

**Поток данных:**
1. Клиент отправляет HTTP запрос на сервер
2. Flask принимает запрос, определяет какой endpoint вызвать
3. Endpoint обращается к базе данных через SQLAlchemy
4. Полученные данные преобразуются в JSON
5. JSON отправляется обратно клиенту

---

## 🔄 Как работает Flask API

### 1. Запуск приложения

```
wsgi.py (точка входа)
    ↓
create_app() (app/__init__.py)
    ↓
Загрузка конфигурации из config.py
    ↓
Инициализация расширений (db, ma, migrate)
    ↓
Регистрация Blueprint'ов (modules.py, cards.py)
    ↓
Создание таблиц БД и тестовых данных
    ↓
Сервер слушает порт 5000
```

### 2. Обработка запроса

```
Запрос: GET /api/v1/modules/1

1. Flask смотрит на URL: /api/v1/modules/1
2. Находит зарегистрированный Blueprint с префиксом /api/v1
3. Внутри blueprint ищет маршрут /modules/<int:module_id>
4. Вызывает функцию get_module(module_id=1)
5. Функция делает запрос к БД: SELECT * FROM modules WHERE id=1
6. Результат преобразуется в JSON через to_dict()
7. JSON отправляется клиенту
```

---

## 🛣️ Понимание путей (URL)

### Структура URL

```
http://127.0.0.1:5000/api/v1/modules/1/cards
│         │      │       │        │  │
│         │      │       │        │  └─ Параметр (ID модуля)
│         │      │       │        └──── Ресурс (карточки)
│         │      │       └────────────── Коллекция ресурсов (модули)
│         │      └────────────────────── Версия API (v1)
│         └───────────────────────────── Префикс API
└─────────────────────────────────────── Хост и порт
```

### Типы путей в приложении

| Тип пути | Пример | Описание |
|----------|--------|----------|
| **Коллекция** | `/api/v1/modules` | Все модули (GET) или создание нового (POST) |
| **Ресурс** | `/api/v1/modules/1` | Конкретный модуль с ID=1 |
| **Вложенный ресурс** | `/api/v1/modules/1/cards` | Карточки внутри модуля 1 |
| **Действие** | `/api/v1/modules/1/clone` | Действие клонирования модуля |

---

## 🔌 Что такое API и зачем нужен префикс /api/v1

### Что такое API?

**API (Application Programming Interface)** — это набор правил и эндпоинтов, через которые клиент (браузер, мобильное приложение) общается с сервером.

**Пример из жизни:**
- Вы заказываете еду через приложение доставки
- Приложение отправляет запрос на сервер: `POST /api/v1/orders`
- Сервер создаёт заказ и возвращает: `{"order_id": 123, "status": "confirmed"}`

### Зачем нужен префикс /api/v1?

```
/api/v1/modules  → версия 1 API
/api/v2/modules  → версия 2 API (если решите изменить формат)
```

**Преимущества:**

1. **Версионирование** — можно изменить API не ломая старых клиентов
   ```
   v1: {"id": 1, "title": "English"}
   v2: {"module_id": 1, "name": "English", "created": "2026-03-22"}
   ```

2. **Разделение с фронтендом** — если будет React приложение:
   ```
   /api/v1/modules  → API для данных
   /                → React приложение (статические файлы)
   ```

3. **Документирование** — сразу видно что это API endpoint

---

## 📡 Как работает запрос-ответ

### Пример: Получение списка модулей

**1. Клиент отправляет запрос:**
```http
GET /api/v1/modules HTTP/1.1
Host: 127.0.0.1:5000
Accept: application/json
```

**2. Flask маршрутизирует запрос:**
```python
# app/api/modules.py
@modules_bp.route('', methods=['GET'])
def get_modules():
    query = Module.query  # Запрос к БД
    modules = query.all()  # Получаем все модули
    return jsonify({'modules': [m.to_dict() for m in modules]})
```

**3. SQLAlchemy генерирует SQL:**
```sql
SELECT modules.id, modules.title, modules.description, ...
FROM modules
ORDER BY modules.updated_at DESC
```

**4. Сервер возвращает JSON:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "modules": [
        {
            "id": 1,
            "title": "English Basics",
            "description": "Базовые слова английского языка",
            "is_public": true,
            "cards_count": 5,
            ...
        }
    ],
    "total": 1,
    "pages": 1
}
```

### Пример: Создание модуля

**Запрос:**
```http
POST /api/v1/modules HTTP/1.1
Content-Type: application/json

{
    "title": "Новый модуль",
    "description": "Описание",
    "is_public": false
}
```

**Обработка в Flask:**
```python
@modules_bp.route('', methods=['POST'])
def create_module():
    data = request.get_json()  # Получаем JSON из запроса
    
    module = Module(
        title=data['title'],
        description=data.get('description', ''),
        user_id=data.get('user_id', 1),  # По умолчанию 1
        is_public=data.get('is_public', False)
    )
    
    db.session.add(module)
    db.session.commit()  # Сохраняем в БД
    
    return jsonify(module.to_dict()), 201  # 201 = Created
```

**Ответ:**
```json
{
    "id": 2,
    "title": "Новый модуль",
    "description": "Описание",
    "user_id": 1,
    "is_public": false,
    "created_at": "2026-03-22T13:00:00",
    "cards_count": 0
}
```

---

## ✅ Готовый функционал

### 📦 Модули (Decks)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/v1/modules` | Список всех модулей (с пагинацией) |
| `GET` | `/api/v1/modules/<id>` | Детали модуля + все карточки |
| `POST` | `/api/v1/modules` | Создать новый модуль |
| `PUT` | `/api/v1/modules/<id>` | Обновить модуль |
| `DELETE` | `/api/v1/modules/<id>` | Удалить модуль |
| `POST` | `/api/v1/modules/<id>/clone` | Клонировать модуль |
| `POST` | `/api/v1/modules/<id>/import` | Импорт карточек из CSV |
| `GET` | `/api/v1/modules/<id>/stats` | Статистика модуля |

**Query параметры для GET /modules:**
- `user_id=1` — фильтровать по владельцу
- `is_public=true` — только публичные модули
- `page=1` — номер страницы
- `per_page=10` — элементов на странице

### 🃏 Карточки

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/v1/cards` | Список карточек |
| `GET` | `/api/v1/cards/<id>` | Детали карточки |
| `POST` | `/api/v1/cards` | Создать карточку |
| `PUT` | `/api/v1/cards/<id>` | Обновить карточку |
| `DELETE` | `/api/v1/cards/<id>` | Удалить карточку |

### 🎓 Режимы обучения

| Endpoint | Описание |
|----------|----------|
| `GET /api/v1/cards/study/<module_id>` | Получить карточку для изучения (Flashcards) |
| `POST /api/v1/cards/<id>/record` | Записать результат (Знаю/Не знаю) |
| `GET /api/v1/cards/review/<module_id>` | Карточки для работы над ошибками |
| `GET /api/v1/cards/quiz/<module_id>` | Данные для теста (4 варианта ответа) |
| `GET /api/v1/cards/<module_id>/progress` | Прогресс обучения по модулю |

### 📊 Параметры для режимов обучения

**GET /cards/study/<module_id>:**
- `user_id=1` — ID пользователя

**POST /cards/<id>/record:**
```json
{
    "user_id": 1,
    "is_success": true
}
```

**GET /cards/review/<module_id>:**
- `limit=10` — макс. количество карточек
- `min_errors=1` — мин. количество ошибок для включения

**GET /cards/quiz/<module_id>:**
- `card_id=5` — конкретная карточка для теста (опционально)

---

## 💻 Примеры использования API

### 1. Получить все модули

```bash
curl http://127.0.0.1:5000/api/v1/modules
```

**Ответ:**
```json
{
    "current_page": 1,
    "modules": [
        {
            "id": 1,
            "title": "English Basics",
            "description": "Базовые слова английского языка",
            "is_public": true,
            "cards_count": 5,
            "owner_username": "testuser"
        }
    ],
    "total": 1,
    "pages": 1
}
```

### 2. Получить модуль с карточками

```bash
curl http://127.0.0.1:5000/api/v1/modules/1
```

**Ответ:**
```json
{
    "id": 1,
    "title": "English Basics",
    "cards": [
        {
            "id": 1,
            "term": "Apple",
            "definition": "Яблоко",
            "example": "I eat an apple every day"
        },
        {
            "id": 2,
            "term": "Book",
            "definition": "Книга",
            "example": "She is reading a book"
        }
    ]
}
```

### 3. Создать новый модуль

```bash
curl -X POST http://127.0.0.1:5000/api/v1/modules \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Мои слова\",\"description\":\"Личный модуль\",\"is_public\":false}"
```

### 4. Получить карточку для изучения

```bash
curl http://127.0.0.1:5000/api/v1/cards/study/1?user_id=1
```

**Ответ:**
```json
{
    "card": {
        "id": 3,
        "term": "Cat",
        "definition": "Кошка",
        "example": "The cat is sleeping",
        "success_rate": 50.0
    },
    "progress": {
        "reviewed": 2,
        "total": 5
    }
}
```

### 5. Записать результат изучения

```bash
curl -X POST http://127.0.0.1:5000/api/v1/cards/3/record \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":1,\"is_success\":true}"
```

**Ответ:**
```json
{
    "message": "Result recorded",
    "card": {
        "id": 3,
        "term": "Cat",
        "success_count": 3,
        "error_count": 1,
        "success_rate": 75.0
    }
}
```

### 6. Получить данные для теста

```bash
curl http://127.0.0.1:5000/api/v1/cards/quiz/1
```

**Ответ:**
```json
{
    "question": {
        "card_id": 1,
        "term": "Apple",
        "example": "I eat an apple every day"
    },
    "options": [
        {"card_id": 2, "definition": "Книга"},
        {"card_id": 4, "definition": "Собака"},
        {"card_id": 1, "definition": "Яблоко"},  ← правильный ответ
        {"card_id": 3, "definition": "Кошка"}
    ],
    "correct_answer": 1
}
```

### 7. Импорт карточек из CSV

**Формат CSV (разделитель `;`):**
```csv
Слово;Перевод;Пример
Apple;Яблоко;I eat an apple
Book;Книга;She reads a book
```

**Запрос:**
```bash
curl -X POST http://127.0.0.1:5000/api/v1/modules/1/import \
  -F "file=@cards.csv" \
  -F "has_header=true"
```

**Ответ:**
```json
{
    "message": "Imported 2 cards",
    "imported_count": 2,
    "errors": null
}
```

### 8. Клонировать публичный модуль

```bash
curl -X POST http://127.0.0.1:5000/api/v1/modules/1/clone \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":2}"
```

**Ответ:**
```json
{
    "id": 3,
    "title": "English Basics (copy)",
    "cloned_from_id": 1,
    "is_public": false,
    "cards_count": 5
}
```

---

## 📁 Структура проекта

```
english-cards/
│
├── app/                          # Основное приложение Flask
│   ├── __init__.py               # Factory функция create_app()
│   ├── config.py                 # Конфигурация (БД, секреты, настройки)
│   ├── models.py                 # SQLAlchemy модели (User, Module, Card, StudyLog)
│   ├── extensions.py             # Инициализация расширений (db, ma, migrate)
│   ├── commands.py               # CLI команды (init-db, seed)
│   │
│   └── api/                      # API Blueprint'ы
│       ├── __init__.py
│       ├── modules.py            # Эндпоинты для модулей
│       └── cards.py              # Эндпоинты для карточек и обучения
│
├── instance/                     # Папка для БД (для file-based SQLite)
│   └── app.db
│
├── wsgi.py                       # Точка входа (запускается сервером)
├── init_db.py                    # Скрипт инициализации БД
├── requirements.txt              # Зависимости Python
├── .env                          # Переменные окружения (секреты, настройки)
├── .gitignore                    # Игнорируемые файлы Git
└── README_GUIDE.md               # Этот файл
```

### Ключевые файлы

| Файл | Назначение |
|------|------------|
| `app/__init__.py` | Создаёт приложение, регистрирует маршруты, инициализирует БД |
| `app/models.py` | Определяет таблицы БД (User, Module, Card, StudyLog) |
| `app/api/modules.py` | Обработчики запросов для модулей (CRUD + clone + import) |
| `app/api/cards.py` | Обработчики для карточек и режимов обучения |
| `app/config.py` | Настройки БД, секретные ключи, параметры пагинации |

---

## 🗄️ Модель данных

### User (Пользователи)
```
id          INTEGER PRIMARY KEY
username    VARCHAR(64) UNIQUE
email       VARCHAR(120) UNIQUE
password_hash VARCHAR(256)
created_at  DATETIME
is_active   BOOLEAN
```

### Module (Модули/Деки)
```
id              INTEGER PRIMARY KEY
title           VARCHAR(200)
description     TEXT
user_id         INTEGER (владелец)
is_public       BOOLEAN (публичный или личный)
created_at      DATETIME
updated_at      DATETIME
cloned_from_id  INTEGER (ссылка на исходный модуль)
```

### Card (Карточки)
```
id              INTEGER PRIMARY KEY
module_id       INTEGER (принадлежит модулю)
term            VARCHAR(500) (слово)
definition      VARCHAR(500) (перевод)
example         TEXT (пример использования)
error_count     INTEGER (статистика ошибок)
success_count   INTEGER (статистика успехов)
last_reviewed   DATETIME (последняя проверка)
created_at      DATETIME
updated_at      DATETIME
```

### StudyLog (Журнал изучения)
```
id          INTEGER PRIMARY KEY
user_id     INTEGER
card_id     INTEGER
module_id   INTEGER (денормализация для быстрых запросов)
result      VARCHAR(10) ('success' или 'fail')
created_at  DATETIME
```

---

## 🚀 Как запустить сервер

```bash
# 1. Перейти в папку проекта
cd "c:\Users\serge\Desktop\Code\Projects\English cards"

# 2. Запустить сервер
python wsgi.py

# Сервер запустится на http://127.0.0.1:5000
```

## 🧪 Тестирование API

```bash
# Проверка статуса
curl http://127.0.0.1:5000/health

# Получить модули
curl http://127.0.0.1:5000/api/v1/modules

# Получить карточки
curl http://127.0.0.1:5000/api/v1/cards
```

---

## 📝 Примечания

### In-memory база данных
Сейчас используется `sqlite:///:memory:` — данные **теряются** при перезапуске сервера.

Для постоянного хранения:
1. Установите PostgreSQL
2. В `config.py` раскомментируйте:
   ```python
   SQLALCHEMY_DATABASE_URI = 'postgresql://user:password@localhost:5432/english_cards'
   ```

### Python 3.13 на Windows
Встроенный `sqlite3` имеет проблемы с file-based БД на Windows. In-memory работает стабильно.

### Безопасность
В production замените:
- `SECRET_KEY` на случайную строку
- Отключите `DEBUG` режим
- Используйте HTTPS

---

## 📚 Словарь терминов

| Термин | Значение |
|--------|----------|
| **Endpoint** | URL + метод (GET/POST) для доступа к ресурсу |
| **Blueprint** | Модуль Flask для группировки маршрутов |
| **ORM** | Object-Relational Mapping (SQLAlchemy) — работа с БД через объекты Python |
| **DTO** | Data Transfer Object — формат данных для передачи между клиентом и сервером |
| **Payload** | Данные в теле запроса (обычно JSON) |
| **Query params** | Параметры в URL после `?` (например, `?page=1&per_page=10`) |

---

**Версия документа:** 1.0  
**Дата:** 22 марта 2026
