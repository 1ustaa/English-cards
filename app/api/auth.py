"""
Authentication API endpoints.

Регистрация, вход, получение профиля пользователя.
JWT-based аутентификация.
"""

from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Blueprint, request, jsonify, current_app
from marshmallow import validate

from app.extensions import db
from app.models import User
from app.api.schemas import RegisterSchema, LoginSchema

auth_bp = Blueprint('auth', __name__)


def generate_token(user: User) -> str:
    """
    Генерирует JWT токен для пользователя.

    Args:
        user: Объект пользователя.

    Returns:
        JWT токен в виде строки.
    """
    payload = {
        'user_id': user.id,
        'email': user.email,
        'exp': datetime.now(timezone.utc) + timedelta(
            hours=current_app.config.get('JWT_EXPIRATION_HOURS', 24)
        ),
        'iat': datetime.now(timezone.utc)
    }
    
    return jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )


def token_required(f):
    """
    Декоратор для защиты endpoints.

    Проверяет наличие валидного JWT токена в заголовке Authorization.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Получаем токен из заголовка
        auth_header = request.headers.get('Authorization')
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            current_user = db.session.get(User, payload['user_id'])
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Регистрация нового пользователя.

    Request Body:
        username: str (3-64 символа)
        email: str (валидный email)
        password: str (минимум 6 символов)

    Returns:
        user: данные пользователя
        token: JWT токен
    """
    data = request.get_json()
    
    # Валидация входных данных
    schema = RegisterSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    # Проверка существования пользователя
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    # Создание пользователя
    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Генерация токена
    token = generate_token(user)
    
    return jsonify({
        'user': user.to_dict(),
        'token': token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Вход пользователя.

    Request Body:
        email: str
        password: str

    Returns:
        user: данные пользователя
        token: JWT токен
    """
    data = request.get_json()
    
    # Валидация
    schema = LoginSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    # Поиск пользователя по email
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Генерация токена
    token = generate_token(user)
    
    return jsonify({
        'user': user.to_dict(),
        'token': token
    }), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """
    Получение данных текущего пользователя.

    Requires: Bearer token в заголовке Authorization.

    Returns:
        user: данные пользователя
    """
    return jsonify({'user': current_user.to_dict()}), 200


@auth_bp.route('/verify', methods=['POST'])
@token_required
def verify_token(current_user):
    """
    Проверка валидности токена.

    Requires: Bearer token в заголовке Authorization.

    Returns:
        valid: true
        user: данные пользователя
    """
    return jsonify({
        'valid': True,
        'user': current_user.to_dict()
    }), 200
