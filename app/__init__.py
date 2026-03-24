"""
Application Factory для Flask приложения.

Создает и настраивает экземпляр приложения, регистрирует blueprints,
инициализирует расширения.
"""

from flask import Flask, request
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
    
    # Создание папки instance если не существует
    app.instance_path = str(app.instance_path)
    import os
    os.makedirs(app.instance_path, exist_ok=True)
    
    # Инициализация расширений
    db.init_app(app)
    ma.init_app(app)
    migrate.init_app(app, db)
    
    # CORS для React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Регистрация CLI команд
    app.cli.add_command(init_db_command)
    
    # Регистрация Blueprint'ов
    register_blueprints(app)
    
    # Инициализация БД для in-memory (только для development)
    if app.config.get('DEBUG') or ':memory:' in app.config.get('SQLALCHEMY_DATABASE_URI', ''):
        with app.app_context():
            db.create_all()
            # Проверяем есть ли данные, если нет - добавляем тестовые
            from app.models import User
            if User.query.count() == 0:
                from app.commands import seed_data
                seed_data()
    
    return app


def register_blueprints(app: Flask) -> None:
    """Регистрирует все Blueprint'ы приложения."""
    
    from app.api.modules import modules_bp
    from app.api.cards import cards_bp
    
    # Получаем префикс из конфига
    api_prefix = app.config.get('API_PREFIX', '/api/v1')
    
    app.register_blueprint(modules_bp, url_prefix=f'{api_prefix}/modules')
    app.register_blueprint(cards_bp, url_prefix=f'{api_prefix}/cards')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'ok', 'service': 'english-cards-api'}
    
    # Заглушки для favicon.ico и robots.txt (чтобы не было 404 в логах)
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
