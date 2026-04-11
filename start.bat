@echo off
chcp 65001 >nul
echo ========================================
echo  English Cards - Production Server
echo ========================================
echo.

REM Проверка .env
if not exist .env (
    echo ERROR: Файл .env не найден!
    echo Создайте .env файл перед запуском.
    echo.
    pause
    exit /b 1
)

REM Проверка Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python не найден!
    echo Установите Python 3.13+
    pause
    exit /b 1
)

REM Проверка зависимостей
echo [1/3] Проверка зависимостей...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo Установка зависимостей...
    pip install -r requirements.txt
)

REM Проверка Node.js
echo [2/3] Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js не найден!
    echo Установите Node.js 18+
    pause
    exit /b 1
)

REM Запуск backend
echo [3/3] Запуск серверов...
echo.
echo ========================================
echo  Backend: http://127.0.0.1:5000
echo  Frontend: http://localhost:5173
echo ========================================
echo.
echo Для остановки закройте окна или нажмите Ctrl+C
echo.

REM Запуск backend в отдельном окне
start "Backend Server" cmd /k "echo Backend Server запущен... && waitress-serve --host=127.0.0.1 --port=5000 --threads=4 wsgi:app"

timeout /t 3 /nobreak >nul

REM Запуск frontend в отдельном окне
start "Frontend Server" cmd /k "cd frontend && echo Frontend Server запущен... && npm run dev"

echo.
echo ========================================
echo  Приложение запущено!
echo ========================================
pause
