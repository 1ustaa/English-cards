import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv

# Загружаем переменные из .env (перезаписываем существующие)
load_dotenv(override=True)

BASE_DIR = Path(__file__).parent.parent  # app/ -> project root


class Config:
    """Базовая конфигурация."""

    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Проверка SECRET_KEY для production
    @classmethod
    def validate(cls):
        """Валидация конфигурации для production."""
        import warnings
        if cls.SECRET_KEY == 'dev-secret-key-change-in-production':
            warnings.warn(
                '⚠️  WARNING: Используется стандартный SECRET_KEY! '
                'Установите уникальное значение в .env файле.',
                UserWarning
            )
        
        db_uri = os.environ.get('DATABASE_URL')
        if not db_uri:
            warnings.warn(
                '⚠️  WARNING: DATABASE_URL не установлен в .env файле.',
                UserWarning
            )
        elif db_uri.startswith('sqlite'):
            warnings.warn(
                '⚠️  WARNING: Используется SQLite вместо PostgreSQL! '
                'Для production настройте DATABASE_URL=postgresql://...',
                UserWarning
            )

    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # PostgreSQL (production) - приоритет
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///:memory:'
    
    # PostgreSQL настройки
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,  # Проверка соединения перед использованием
        'pool_recycle': 300,    # Пересоздавать соединения через 5 минут
    }
    
    # PostgreSQL (production - раскомментировать и настроить)
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
    #     'postgresql://user:password@localhost:5432/english_cards'
    
    # API
    API_PREFIX = '/api/v1'
    
    # CORS настройки
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS') or '*'
    
    # Pagination
    CARDS_PER_PAGE = 20
    MODULES_PER_PAGE = 10

    # JWT Authentication
    JWT_EXPIRATION_HOURS = 24  # Токен действителен 24 часа
    
    # CSV Import
    MAX_CSV_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    CSV_DELIMITER = ';'  # Требование: "Слово;Перевод;Пример"


class DevelopmentConfig(Config):
    """Конфигурация для разработки."""
    DEBUG = False  # Отключено для совместимости с Python 3.13 на Windows
    SQLALCHEMY_ECHO = False  # Включить для отладки SQL запросов


class ProductionConfig(Config):
    """Конфигурация для продакшена."""
    DEBUG = False
    
    @classmethod
    def init_app(cls, app):
        # В продакшене логируем ошибки
        import logging
        from logging.handlers import RotatingFileHandler
        
        log_dir = BASE_DIR / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        if not app.debug:
            handler = RotatingFileHandler(
                log_dir / 'app.log',
                maxBytes=10 * 1024 * 1024,
                backupCount=10
            )
            handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
            ))
            handler.setLevel(logging.INFO)
            app.logger.addHandler(handler)
            app.logger.setLevel(logging.INFO)


class TestingConfig(Config):
    """Конфигурация для тестов."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
