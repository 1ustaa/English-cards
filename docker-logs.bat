@echo off
REM Скрипт для просмотра логов приложения в Docker

echo ========================================
echo  English Cards - Docker Logs
echo ========================================
echo.

echo Логи приложения (Ctrl+C для выхода)...
echo.

docker-compose logs -f web
