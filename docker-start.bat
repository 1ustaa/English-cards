@echo off
REM Скрипт для запуска приложения в Docker

echo ========================================
echo  English Cards - Docker Setup
echo ========================================
echo.

REM Проверяем что .env существует
if not exist .env (
    echo [INFO] .env файл не найден, создаем из .env.example
    copy .env.example .env
    echo [WARNING] Пожалуйста, измените SECRET_KEY в файле .env
    echo.
)

echo [1/4] Запуск PostgreSQL базы данных...
docker-compose up -d db

echo [2/4] Ожидание готовности базы данных...
timeout /t 5 /nobreak >nul

echo [3/4] Сборка и запуск приложения...
docker-compose up -d web

echo [4/4] Проверка статуса...
docker-compose ps

echo.
echo ========================================
echo  Приложение запущено!
echo  Frontend: http://localhost:8000
echo  Backend API: http://localhost:8000/api/v1
echo  Health Check: http://localhost:8000/health
echo ========================================
echo.
echo Для просмотра логов: docker-compose logs -f web
echo Для остановки: docker-compose down
echo.
pause
