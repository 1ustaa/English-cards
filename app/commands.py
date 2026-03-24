"""
CLI команды для управления приложением.

Использование:
    flask init-db
    flask init-db --drop  # Удалить и создать заново
"""

import click
from flask import current_app
from flask.cli import with_appcontext

from app.extensions import db
from app.models import User, Module, Card, StudyLog


@click.command('init-db')
@click.option('--drop', is_flag=True, help='Удалить существующие таблицы перед созданием')
@click.option('--seed', is_flag=True, help='Добавить тестовые данные')
@with_appcontext
def init_db_command(drop: bool, seed: bool) -> None:
    """
    Инициализирует базу данных.
    
    Создает все таблицы согласно моделям SQLAlchemy.
    """
    
    if drop:
        click.echo('Удаление существующих таблиц...')
        db.drop_all()
        click.echo('Таблицы удалены.')
    
    click.echo('Создание таблиц базы данных...')
    db.create_all()
    click.echo('Таблицы созданы.')
    
    if seed:
        click.echo('Добавление тестовых данных...')
        seed_data()
        click.echo('Тестовые данные добавлены.')
    
    click.echo('База данных инициализирована!')


def seed_data() -> None:
    """Добавляет тестового пользователя и демо-модуль."""
    
    # Создаем тестового пользователя
    user = User.query.filter_by(username='testuser').first()
    if not user:
        user = User(username='testuser', email='test@example.com')
        user.set_password('password123')
        db.session.add(user)
        click.echo(f'  - Создан пользователь: {user.username}')
    
    # Создаем демо-модуль с карточками
    module = Module.query.filter_by(title='English Basics').first()
    if not module:
        module = Module(
            title='English Basics',
            description='Базовые слова английского языка',
            user_id=user.id,
            is_public=True
        )
        db.session.add(module)
        db.session.flush()  # Получаем ID модуля
        
        # Добавляем карточки
        cards_data = [
            ('Apple', 'Яблоко', 'I eat an apple every day.'),
            ('Book', 'Книга', 'She is reading a book.'),
            ('Cat', 'Кошка', 'The cat is sleeping on the sofa.'),
            ('Dog', 'Собака', 'My dog loves to play fetch.'),
            ('Elephant', 'Слон', 'Elephants are the largest land animals.'),
        ]
        
        for term, definition, example in cards_data:
            card = Card(
                module_id=module.id,
                term=term,
                definition=definition,
                example=example
            )
            db.session.add(card)
        
        click.echo(f'  - Создан модуль: {module.title} с {len(cards_data)} карточками')
    
    db.session.commit()
