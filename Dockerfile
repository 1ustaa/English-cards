# Backend Dockerfile
FROM python:3.13-slim

# Рабочая директория
WORKDIR /app

# Переменные окружения
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=wsgi.py \
    FLASK_ENV=production

# Системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код (включая migrations/)
COPY . .

# Проверяем что migrations на месте
RUN ls -la /app/migrations/

# Собираем фронтенд
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Возвращаемся в backend
WORKDIR /app

# Создаём директорию для логов
RUN mkdir -p logs

# Порт
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Запуск через gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", "--timeout", "120", "wsgi:app"]
