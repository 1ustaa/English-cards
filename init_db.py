"""Скрипт инициализации БД."""

from app import create_app
from app.extensions import db
from app.commands import seed_data
from app.models import User, Module, Card

def init_db():
    app = create_app('development')
    
    with app.app_context():
        # Удаляем старые таблицы
        db.drop_all()
        
        # Создаем новые
        db.create_all()
        
        # Добавляем тестовые данные
        seed_data()
        
        # Проверяем
        users_count = User.query.count()
        modules_count = Module.query.count()
        cards_count = Card.query.count()
        
        print(f"База данных инициализирована!")
        print(f"  Пользователей: {users_count}")
        print(f"  Модулей: {modules_count}")
        print(f"  Карточек: {cards_count}")

if __name__ == '__main__':
    init_db()
