"""
SQLAlchemy модели данных.

Модели спроектированы с учетом:
- Будущей многопользовательской архитектуры
- Публичных/приватных модулей (is_public)
- Статистики обучения для карточек
- Аудита через StudyLog
"""

from datetime import datetime, timezone
from typing import List, Optional
from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db


class User(db.Model):
    """
    Пользователь системы.
    
    В будущем: репетитор может иметь студентов, назначать им модули.
    """
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Связи
    modules = db.relationship('Module', backref='owner', lazy='dynamic', cascade='all, delete-orphan')
    study_logs = db.relationship('StudyLog', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password: str) -> None:
        """Хеширует и устанавливает пароль."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """Проверяет пароль против хеша."""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self) -> str:
        return f'<User {self.username}>'
    
    def to_dict(self) -> dict:
        """Сериализация для API (без пароля)."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'modules_count': self.modules.count()
        }


class Module(db.Model):
    """
    Модуль (deck) с карточками.
    
    is_public=True: модуль виден всем, можно клонировать.
    is_public=False: личный модуль пользователя.
    """
    
    __tablename__ = 'modules'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Владелец модуля
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Публичность
    is_public = db.Column(db.Boolean, default=False, nullable=False, index=True)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Для клонированных модулей
    cloned_from_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=True)
    
    # Связи
    cards = db.relationship('Card', backref='module', lazy='dynamic', cascade='all, delete-orphan', order_by='Card.id')
    
    # Ссылка на исходный модуль (если это клон)
    source_module = db.relationship('Module', remote_side=[id], backref='clones')
    
    __table_args__ = (
        # Индекс для быстрого поиска публичных модулей
        db.Index('idx_modules_public', 'is_public', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f'<Module {self.title}>'
    
    def to_dict(self, include_cards: bool = False) -> dict:
        """Сериализация для API."""
        result = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'user_id': self.user_id,
            'owner_username': self.owner.username if self.owner else None,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'cloned_from_id': self.cloned_from_id,
            'cards_count': self.cards.count()
        }
        
        if include_cards:
            result['cards'] = [card.to_dict() for card in self.cards.all()]
        
        return result
    
    def get_success_rate(self) -> Optional[float]:
        """
        Вычисляет общий процент успеха по всем карточкам модуля.
        
        Returns:
            Процент успеха (0-100) или None если нет данных.
        """
        total_success = sum(card.success_count for card in self.cards.all())
        total_error = sum(card.error_count for card in self.cards.all())
        total = total_success + total_error
        
        if total == 0:
            return None
        
        return (total_success / total) * 100


class Card(db.Model):
    """
    Карточка для изучения.
    
    Содержит термин, определение и пример.
    Ведет статистику успешности для режима "Работа над ошибками".
    """
    
    __tablename__ = 'cards'
    
    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=False, index=True)
    
    # Контент
    term = db.Column(db.String(500), nullable=False)  # Слово/термин
    definition = db.Column(db.String(500), nullable=False)  # Перевод/определение
    example = db.Column(db.Text, nullable=True)  # Пример использования (опционально)
    
    # Статистика обучения
    error_count = db.Column(db.Integer, default=0, nullable=False)
    success_count = db.Column(db.Integer, default=0, nullable=False)
    last_reviewed = db.Column(db.DateTime, nullable=True)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Связи
    study_logs = db.relationship('StudyLog', backref='card', lazy='dynamic', cascade='all, delete-orphan')
    
    __table_args__ = (
        # Индекс для выборки карточек с ошибками
        db.Index('idx_cards_errors', 'module_id', 'error_count'),
    )
    
    def __repr__(self) -> str:
        return f'<Card {self.term[:30]}...>'
    
    def to_dict(self) -> dict:
        """Сериализация для API."""
        return {
            'id': self.id,
            'module_id': self.module_id,
            'term': self.term,
            'definition': self.definition,
            'example': self.example,
            'error_count': self.error_count,
            'success_count': self.success_count,
            'last_reviewed': self.last_reviewed.isoformat() if self.last_reviewed else None,
            'success_rate': self.get_success_rate(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def get_success_rate(self) -> Optional[float]:
        """
        Вычисляет процент успеха для карточки.
        
        Returns:
            Процент успеха (0-100) или None если нет попыток.
        """
        total = self.success_count + self.error_count
        if total == 0:
            return None
        return (self.success_count / total) * 100
    
    def record_result(self, is_success: bool) -> None:
        """
        Записывает результат изучения карточки.
        
        Args:
            is_success: True если ответ верный, False если ошибка.
        """
        if is_success:
            self.success_count += 1
        else:
            self.error_count += 1
        self.last_reviewed = datetime.now(timezone.utc)


class StudyLog(db.Model):
    """
    Журнал изучения.
    
    Логирует каждую попытку изучения карточки для аналитики.
    Используется для:
    - Отслеживания прогресса пользователя
    - Анализа сложных тем
    - Истории обучения
    """
    
    __tablename__ = 'study_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Связи
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=False, index=True)
    
    # Результат
    result = db.Column(db.String(10), nullable=False)  # 'success' или 'fail'
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Связь с модулем (денормализация для быстрых запросов)
    module_id = db.Column(db.Integer, nullable=True, index=True)
    
    __table_args__ = (
        # Композитный индекс для аналитики по пользователю и дате
        db.Index('idx_study_logs_user_date', 'user_id', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f'<StudyLog user={self.user_id} card={self.card_id} result={self.result}>'
    
    def to_dict(self) -> dict:
        """Сериализация для API."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'card_id': self.card_id,
            'card_term': self.card.term if self.card else None,
            'result': self.result,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    @classmethod
    def create(cls, user_id: int, card: Card, is_success: bool) -> 'StudyLog':
        """
        Factory метод для создания записи лога.
        
        Args:
            user_id: ID пользователя.
            card: Карточка которую изучали.
            is_success: Результат изучения.
        
        Returns:
            Созданная запись StudyLog.
        """
        log = cls(
            user_id=user_id,
            card=card,
            result='success' if is_success else 'fail',
            module_id=card.module_id
        )
        return log
