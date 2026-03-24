import os
import tempfile
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent  # app/ -> project root


class Config:
    """Базовая конфигурация."""
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # SQLite (development)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # ВНИМАНИЕ: Python 3.13 на Windows имеет проблемы с SQLite.
    # Для разработки используем in-memory БД (данные теряются после перезапуска).
    # Для продакшена используйте PostgreSQL.
    # Игнорируем DATABASE_URL из .env для совместимости
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Дополнительные параметры для SQLite
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'timeout': 30},
        'pool_pre_ping': True,  # Проверка соединения перед использованием
    }
    
    # PostgreSQL (production - раскомментировать и настроить)
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
    #     'postgresql://user:password@localhost:5432/english_cards'
    
    # API
    API_PREFIX = '/api/v1'
    
    # Pagination
    CARDS_PER_PAGE = 20
    MODULES_PER_PAGE = 10
    
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
