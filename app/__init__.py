"""
Application Factory для Flask приложения.

Создает и настраивает экземпляр приложения, регистрирует blueprints,
инициализирует расширения.
"""

from pathlib import Path
from flask import Flask, request, send_from_directory
from flask_cors import CORS

from app.config import config
from app.extensions import db, ma, migrate
from app.commands import init_db_command


def create_app(config_name: str = None) -> Flask:
    """
    Factory для создания приложения Flask.
    
    Args:
        config_name: Имя конфигурации ('development', 'production', 'testing').
                     По умолчанию используется 'default'.
    
    Returns:
        Настроенный экземпляр Flask приложения.
    """
    
    if config_name is None:
        config_name = 'default'

    app = Flask(__name__, instance_relative_config=True)

    # Загрузка конфигурации
    app.config.from_object(config[config_name])
    
    # Валидация конфигурации
    config[config_name].validate()
    
    # Создание папки instance если не существует
    app.instance_path = str(app.instance_path)
    import os
    os.makedirs(app.instance_path, exist_ok=True)
    
    # Инициализация расширений
    db.init_app(app)
    ma.init_app(app)
    migrate.init_app(app, db)
    
    # CORS для React frontend
    cors_origins = app.config.get('CORS_ORIGINS', '*')
    CORS(app, resources={r"/api/*": {"origins": cors_origins.split(',')}})

    # Регистрация CLI команд
    app.cli.add_command(init_db_command)

    # Регистрация Blueprint'ов
    register_blueprints(app)

    return app


def register_blueprints(app: Flask) -> None:
    """Регистрирует все Blueprint'ы приложения."""

    from app.api.modules import modules_bp
    from app.api.cards import cards_bp
    from app.api.auth import auth_bp

    # Получаем префикс из конфига
    api_prefix = app.config.get('API_PREFIX', '/api/v1')

    app.register_blueprint(modules_bp, url_prefix=f'{api_prefix}/modules')
    app.register_blueprint(cards_bp, url_prefix=f'{api_prefix}/cards')
    app.register_blueprint(auth_bp, url_prefix=f'{api_prefix}/auth')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'ok', 'service': 'english-cards-api'}

    # Раздача фронтенда (production)
    frontend_dist = Path(__file__).parent.parent / 'frontend' / 'dist'
    
    if frontend_dist.exists():
        @app.route('/')
        def index():
            """Главная страница - фронтенд."""
            return send_from_directory(frontend_dist, 'index.html')
        
        @app.route('/<path:path>')
        def serve_frontend(path):
            """
            Раздаёт статические файлы фронтенда.
            Для SPA роутинга - возвращает index.html для всех не-API путей.
            """
            # Если файл существует - отдаём его
            file_path = frontend_dist / path
            if file_path.exists() and file_path.is_file():
                return send_from_directory(frontend_dist, path)
            
            # Иначе отдаём index.html (для React Router)
            return send_from_directory(frontend_dist, 'index.html')

    # Заглушки для favicon.ico и robots.txt
    @app.route('/favicon.ico')
    def favicon():
        return '', 204
    
    @app.route('/robots.txt')
    def robots():
        return '', 204
    
    # Логирование всех 404 ошибок
    @app.errorhandler(404)
    def not_found_error(error):
        app.logger.warning(f'404 Error: {request.url} from {request.remote_addr}')
        return {'error': 'Not Found', 'url': request.url, 'method': request.method}, 404
