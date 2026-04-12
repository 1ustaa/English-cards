# 🚀 Деплой приложения

## 📋 Содержание

1. [Локальная разработка](#локальная-разработка)
2. [Docker деплой](#docker-деплой)
3. [Production сервер](#production-сервер)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [Обновление приложения](#обновление-приложения)

---

## Локальная разработка

### Backend
```bash
cd "c:\Users\serge\Desktop\Code\Projects\English cards"
pip install -r requirements.txt
python wsgi.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Docker деплой

### Быстрый старт

**Windows:**
```bash
# Запуск
docker-start.bat

# Остановка
docker-stop.bat

# Логи
docker-logs.bat
```

**Linux/Mac:**
```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Логи
docker-compose logs -f web
```

### Пошаговая инструкция

**1. Создать .env файл:**
```bash
cp .env.example .env
```

**2. Изменить SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Вставьте полученное значение в `.env`:
```env
SECRET_KEY=<ваш_ключ>
```

**3. Запустить приложение:**
```bash
docker-compose up -d
```

**4. Проверить работу:**
```bash
# Health check
curl http://localhost:8000/health

# Открыть браузер
http://localhost:8000
```

### Сервисы

| Сервис | Порт | Описание |
|--------|------|----------|
| web | 8000 | Backend + Frontend |
| db | 5432 | PostgreSQL |
| pgadmin | 5050 | PgAdmin (опционально) |

**Запустить PgAdmin:**
```bash
docker-compose --profile tools up -d pgadmin
```

Откройте http://localhost:5050 и подключитесь к базе:
- Host: `db`
- Port: `5432`
- User: `english_user`
- Password: `english_password`

---

## Production сервер

### Требования

- **VPS/VDS** с Docker и Docker Compose
- **Домен** (например, english-cards.ru)
- **SSL сертификат** (Let's Encrypt - бесплатно)

### Шаг 1: Арендовать сервер

**Рекомендуемые провайдеры:**
- DigitalOcean ($6/мес)
- Linode ($5/мес)
- Hetzner (€4/мес)
- Timeweb (от 250₽/мес)

**Минимальные требования:**
- CPU: 1 core
- RAM: 1 GB
- Disk: 20 GB
- OS: Ubuntu 22.04 LTS

### Шаг 2: Подключить домен

**DNS записи:**
```
A    @           -> <IP вашего сервера>
A    www         -> <IP вашего сервера>
CNAME  api       -> @
```

### Шаг 3: Настроить сервер

**Подключиться по SSH:**
```bash
ssh root@<IP сервера>
```

**Установить Docker:**
```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER
```

**Установить Docker Compose:**
```bash
apt update
apt install docker-compose-plugin
```

### Шаг 4: Загрузить приложение

**Клонировать репозиторий:**
```bash
git clone https://github.com/<your-username>/english-cards.git
cd english-cards
```

**Создать .env:**
```bash
cp .env.example .env
nano .env
```

**Изменить:**
```env
SECRET_KEY=<сгенерированный_ключ>
CORS_ORIGINS=https://english-cards.ru,https://www.english-cards.ru
POSTGRES_PASSWORD=<надежный_пароль>
```

### Шаг 5: Настроить Nginx + SSL

**Установить Certbot:**
```bash
apt install certbot
```

**Получить SSL сертификат:**
```bash
certbot certonly --standalone -d english-cards.ru -d www.english-cards.ru
```

**Создать Nginx конфиг:**
```bash
nano /etc/nginx/sites-available/english-cards
```

**Вставить конфигурацию** (см. `nginx.conf` в репозитории, заменить `_` на ваш домен)

**Активировать:**
```bash
ln -s /etc/nginx/sites-available/english-cards /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Шаг 6: Запустить приложение

```bash
docker-compose up -d
```

**Проверить:**
```bash
curl https://english-cards.ru/health
```

### Шаг 7: Настроить автообновление SSL

```bash
crontab -e
```

**Добавить строку:**
```
0 3 * * * certbot renew --post-hook "systemctl reload nginx"
```

---

## GitHub Actions CI/CD

### Настройка

**1. Создать Secrets в GitHub:**

Перейдите в `Settings -> Secrets and variables -> Actions`

Добавьте:
- `SSH_PRIVATE_KEY`: Ваш SSH ключ для подключения к серверу
- `SERVER_HOST`: IP адрес сервера
- `SERVER_USER`: Имя пользователя (например, `root`)

**2. Автоматический деплой:**

При push в `main` автоматически:
1. Запускаются тесты
2. Собирается Docker образ
3. Деплой на сервер (если настроено)

### Ручной деплой

```bash
# На сервере
cd /path/to/english-cards
git pull
docker-compose up -d --build
```

---

## Обновление приложения

### Docker

```bash
# Остановить
docker-compose down

# Обновить код
git pull

# Пересобрать и запустить
docker-compose up -d --build

# Удалить старые образы
docker image prune -f
```

### Без Docker

```bash
# Остановить сервер
# Если через systemd:
systemctl stop english-cards

# Обновить код
git pull

# Обновить зависимости
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..

# Применить миграции
flask db upgrade

# Запустить сервер
systemctl start english-cards
```

---

## Мониторинг

### Логи

**Docker:**
```bash
docker-compose logs -f web
```

**Backend логи:**
```bash
docker exec english-cards-web cat /app/logs/app.log
```

**PostgreSQL логи:**
```bash
docker exec english-cards-db tail -f /var/log/postgresql/postgresql-16-main.log
```

### Health Check

```bash
curl https://english-cards.ru/health
```

**Ответ:**
```json
{
  "status": "ok",
  "service": "english-cards-api"
}
```

### Метрики

**Размер базы данных:**
```bash
docker exec english-cards-db psql -U english_user -d english_cards -c "SELECT pg_size_pretty(pg_database_size('english_cards'));"
```

**Статистика пользователей:**
```bash
docker exec english-cards-db psql -U english_user -d english_cards -c "SELECT COUNT(*) FROM users;"
```

---

## Troubleshooting

### Контейнер не запускается

```bash
# Проверить логи
docker-compose logs web

# Перезапустить
docker-compose restart web
```

### Ошибка подключения к БД

```bash
# Проверить что БД запущена
docker-compose ps

# Проверить логи БД
docker-compose logs db

# Проверить подключение
docker exec english-cards-web python -c "
import os
from app import create_app
app = create_app('production')
with app.app_context():
    from app.extensions import db
    print(db.engine.execute('SELECT 1').fetchone())
"
```

### Миграции не применяются

```bash
# Проверить текущую версию
docker exec english-cards-web python db.py current

# Применить
docker exec english-cards-web python db.py upgrade

# Откатить и применить заново
docker exec english-cards-web python db.py downgrade -1
docker exec english-cards-web python db.py upgrade
```

### Nginx не работает

```bash
# Проверить конфигурацию
nginx -t

# Перезапустить
systemctl restart nginx

# Проверить логи
tail -f /var/log/nginx/error.log
```

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи контейнеров
2. Убедитесь что все сервисы запущены
3. Проверьте `.env` файл
4. Откройте Issue на GitHub

---

**Готово! Приложение работает в production!** 🎉
