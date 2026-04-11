# 🚀 Production Deployment Guide

## 📋 Требования

### Системные требования
- **Python 3.13+**
- **PostgreSQL 14+**
- **Node.js 18+**
- **npm** (устанавливается с Node.js)

### Production сервер
- **Windows:** Waitress WSGI Server
- **Linux/Mac:** Gunicorn WSGI Server
- **Reverse Proxy:** Nginx (рекомендуется)

---

## 🔧 Установка

### 1. Клонирование репозитория

```bash
cd "c:\Users\serge\Desktop\Code\Projects"
git clone <repository-url>
cd "English cards"
```

### 2. Установка зависимостей

**Python:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 3. Настройка переменных окружения

Создайте файл `.env`:

```env
# Flask
FLASK_APP=wsgi.py
FLASK_ENV=production

# Security - ОБЯЗАТЕЛЬНО измените!
# Сгенерируйте случайную строку: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-very-secret-key-change-this-in-production

# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/english_cards

# CORS - укажите домен вашего frontend
# Для development: *
# Для production: http://yourdomain.com,https://yourdomain.com
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# API
API_PREFIX=/api/v1
```

**⚠️ ВАЖНО:**
- Никогда не коммитьте `.env` в git
- Сгенерируйте уникальный `SECRET_KEY`
- Измените пароль PostgreSQL от стандартного

### 4. Настройка базы данных

**Создайте базу данных:**
```bash
# Windows (через pgAdmin или cmd)
cmd /c "set PGPASSWORD=YOUR_PASSWORD && psql -U postgres -c \"CREATE DATABASE english_cards;\""

# Linux/Mac
createdb -U postgres english_cards
```

**Примените миграции:**
```bash
flask db upgrade
```

**Добавьте тестовые данные (опционально):**
```bash
flask init-db --seed
```

### 5. Сборка frontend

```bash
cd frontend
npm run build
```

Собранные файлы появятся в `frontend/dist/`

---

## ▶️ Запуск приложения

### Вариант 1: Waitress (Windows)

```bash
waitress-serve --host=0.0.0.0 --port=5000 --threads=4 wsgi:app
```

### Вариант 2: Gunicorn (Linux/Mac)

```bash
gunicorn --bind 0.0.0.0:5000 --workers 4 --threads 2 wsgi:app
```

### Вариант 3: Production скрипт

**Windows - `start_production.bat`:**
```batch
@echo off
echo ========================================
echo  English Cards - Production Server
echo ========================================
echo.

REM Проверка .env
if not exist .env (
    echo ERROR: Файл .env не найден!
    echo Создайте .env файл перед запуском.
    pause
    exit /b 1
)

REM Запуск backend
echo [1/2] Запуск backend сервера...
start "Backend Server" cmd /k "waitress-serve --host=127.0.0.1 --port=5000 --threads=4 wsgi:app"

timeout /t 3 /nobreak >nul

REM Запуск frontend dev сервера (для разработки)
echo [2/2] Запуск frontend сервера...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  Приложение запущено!
echo  Frontend: http://localhost:5173
echo  Backend:  http://127.0.0.1:5000
echo ========================================
echo.
echo Для остановки закройте окна терминала или нажмите Ctrl+C
pause
```

**Linux/Mac - `start_production.sh`:**
```bash
#!/bin/bash

echo "========================================"
echo " English Cards - Production Server"
echo "========================================"
echo

# Проверка .env
if [ ! -f .env ]; then
    echo "ERROR: Файл .env не найден!"
    echo "Создайте .env файл перед запуском."
    exit 1
fi

# Запуск backend
echo "[1/2] Запуск backend сервера..."
gunicorn --bind 127.0.0.1:5000 --workers 4 --threads 2 wsgi:app &
BACKEND_PID=$!

sleep 3

# Проверка backend
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "[2/2] Backend запущен (PID: $BACKEND_PID)"
    echo
    echo "========================================"
    echo " Backend запущен: http://127.0.0.1:5000"
    echo " Для остановки: kill $BACKEND_PID"
    echo "========================================"
else
    echo "ERROR: Backend не запустился!"
    exit 1
fi

# Ожидание
wait $BACKEND_PID
```

---

## 🌐 Nginx конфигурация (опционально)

### Установка Nginx

**Windows:**
```bash
# Скачайте с http://nginx.org/en/download.html
# Распакуйте и настройте
```

**Linux:**
```bash
sudo apt update
sudo apt install nginx
```

### Конфигурация Nginx

Создайте файл `/etc/nginx/sites-available/english-cards`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend статические файлы
    location / {
        root /path/to/english-cards/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin http://yourdomain.com always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        # Preflight requests
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000;
    }

    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}
```

**Активация:**
```bash
sudo ln -s /etc/nginx/sites-available/english-cards /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Безопасность

### 1. SECRET_KEY

**Сгенерируйте уникальный ключ:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**Никогда не используйте:**
- `dev-secret-key-change-in-production`
- Ключи из примеров
- Простые слова

### 2. PostgreSQL пароль

**Измените пароль по умолчанию:**
```sql
ALTER USER postgres WITH PASSWORD 'your-strong-password';
```

**Создайте отдельного пользователя для приложения:**
```sql
CREATE USER english_cards_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE english_cards TO english_cards_user;
```

### 3. CORS

**Ограничьте доступ только для вашего домена:**
```env
# ПЛОХО (для production):
CORS_ORIGINS=*

# ХОРОШО:
CORS_ORIGINS=http://yourdomain.com,https://yourdomain.com
```

### 4. Файлы

**Добавьте в `.gitignore`:**
```
.env
instance/
*.db
__pycache__/
frontend/node_modules/
frontend/dist/
logs/
```

**Никогда не коммитьте:**
- Пароли
- API ключи
- `.env` файлы
- Базы данных

---

## 📊 Мониторинг

### Логирование

**Настроено в `config.py`:**
- Логи сохраняются в `logs/app.log`
- Ротация: 10 файлов по 10MB
- Формат: `[время] LEVEL: сообщение [файл:строка]`

**Просмотр логов:**
```bash
# Windows
type logs\app.log

# Linux
tail -f logs/app.log
```

### Health Check

**Проверка работоспособности:**
```bash
curl http://localhost:5000/health
```

**Ответ:**
```json
{
  "status": "ok",
  "service": "english-cards-api"
}
```

### Мониторинг PostgreSQL

**Проверка подключения:**
```bash
psql -U postgres -d english_cards -c "SELECT 1"
```

**Размер базы:**
```sql
SELECT pg_size_pretty(pg_database_size('english_cards'));
```

---

## 🔄 Обновление приложения

### 1. Получить обновления
```bash
git pull origin main
```

### 2. Обновить зависимости
```bash
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

### 3. Применить миграции
```bash
flask db upgrade
```

### 4. Пересобрать frontend
```bash
cd frontend && npm run build && cd ..
```

### 5. Перезапустить сервер
```bash
# Остановить старый процесс
# Запустить новый
waitress-serve --host=0.0.0.0 --port=5000 --threads=4 wsgi:app
```

---

## 🐛 Troubleshooting

### Ошибка: "password authentication failed"

1. Проверьте пароль в `.env`
2. Проверьте что пользователь существует: `psql -U postgres -c "\du"`
3. Сбросьте пароль: `ALTER USER postgres WITH PASSWORD 'new-password';`

### Ошибка: "database does not exist"

```bash
# Создать базу данных
psql -U postgres -c "CREATE DATABASE english_cards;"
```

### Ошибка: "Address already in use"

```bash
# Windows - найти процесс
netstat -ano | findstr :5000
taskkill /F /PID <PID>

# Linux
lsof -ti:5000 | xargs kill -9
```

### Frontend не подключается к Backend

1. Проверьте что backend запущен: `curl http://localhost:5000/health`
2. Проверьте CORS настройки в `.env`
3. Откройте консоль браузера - там будут ошибки

### Миграции не применяются

```bash
# Проверить текущую версию
flask db current

# Проверить историю
flask db history

# Откатить и применить заново
flask db downgrade -1
flask db upgrade
```

---

## 📈 Оптимизация производительности

### 1. База данных

**Индексы уже созданы для:**
- `users.username`, `users.email`
- `modules.user_id`, `modules.is_public`
- `cards.module_id`
- `study_logs.user_id`, `study_logs.card_id`, `study_logs.created_at`

**Добавьте connection pooling:**
```python
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'pool_size': 10,
    'max_overflow': 20,
}
```

### 2. Frontend

**Кэширование в Nginx:**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Backend

**Используйте production WSGI сервер:**
- ❌ Flask development server (`app.run()`)
- ✅ Waitress (Windows)
- ✅ Gunicorn (Linux)

**Добавьте кэширование (опционально):**
```bash
pip install Flask-Caching
```

---

## ✅ Production Checklist

- [ ] PostgreSQL установлен и настроен
- [ ] База данных создана
- [ ] Миграции применены
- [ ] `.env` файл создан с правильными значениями
- [ ] `SECRET_KEY` сгенерирован случайно
- [ ] PostgreSQL пароль изменён от стандартного
- [ ] CORS настроен для конкретного домена
- [ ] Frontend собран (`npm run build`)
- [ ] Backend запущен через Waitress/Gunicorn
- [ ] Nginx настроен (опционально)
- [ ] Логи работают
- [ ] Health check отвечает
- [ ] `.env` не закоммичен в git
- [ ] Файрвол настроен (порт 5000/80)

---

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи: `logs/app.log`
2. Проверьте консоль браузера (F12)
3. Убедитесь что все сервисы запущены
4. Проверьте `.env` файл

---

**Готово! Приложение работает в production режиме.** 🎉
