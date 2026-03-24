"""
API Blueprint для карточек и обучения.

Endpoints:
    GET    /cards                  - Список карточек (с фильтрацией)
    GET    /cards/<id>             - Детали карточки
    POST   /cards                  - Создать карточку
    PUT    /cards/<id>             - Обновить карточку
    DELETE /cards/<id>             - Удалить карточку
    
    GET    /cards/study/<module_id>        - Получить карточку для изучения
    POST   /cards/<id>/record      - Записать результат изучения
    GET    /cards/review/<module_id>       - Карточки для работы над ошибками
    GET    /cards/quiz/<module_id>         - Данные для теста (4 варианта)
"""

import random
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, current_app
from typing import Any, Dict, List, Optional

from app.extensions import db
from app.models import Card, Module, StudyLog, User

cards_bp = Blueprint('cards', __name__)


# =============================================================================
# CRUD операции для карточек
# =============================================================================

@cards_bp.route('', methods=['GET'])
def get_cards():
    """
    Получить список карточек.
    
    Query params:
        module_id: Фильтр по модулю
        user_id: Фильтр по владельцу модуля
        page: Номер страницы
        per_page: Количество на странице
    """
    module_id = request.args.get('module_id', type=int)
    user_id = request.args.get('user_id', type=int)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', current_app.config.get('CARDS_PER_PAGE', 20), type=int)
    
    query = Card.query
    
    if module_id:
        query = query.filter_by(module_id=module_id)
    elif user_id:
        # Получаем все модули пользователя
        module_ids = [m.id for m in Module.query.filter_by(user_id=user_id).all()]
        query = query.filter(Card.module_id.in_(module_ids))
    
    query = query.order_by(Card.term.asc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'cards': [c.to_dict() for c in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@cards_bp.route('/<int:card_id>', methods=['GET'])
def get_card(card_id):
    """Получить детали карточки."""
    card = Card.query.get_or_404(card_id)
    return jsonify(card.to_dict())


@cards_bp.route('', methods=['POST'])
def create_card():
    """
    Создать новую карточку.
    
    Body:
        module_id: ID модуля
        term: Слово/термин
        definition: Перевод/определение
        example: Пример использования (опционально)
    """
    data = request.get_json()
    
    required_fields = ['module_id', 'term', 'definition']
    missing = [f for f in required_fields if not data.get(f)]
    
    if missing:
        return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
    
    # Проверяем существование модуля
    module = Module.query.get(data['module_id'])
    if not module:
        return jsonify({'error': 'Module not found'}), 404
    
    card = Card(
        module_id=data['module_id'],
        term=data['term'],
        definition=data['definition'],
        example=data.get('example')
    )
    
    db.session.add(card)
    db.session.commit()
    
    return jsonify(card.to_dict()), 201


@cards_bp.route('/<int:card_id>', methods=['PUT'])
def update_card(card_id):
    """Обновить карточку."""
    card = Card.query.get_or_404(card_id)
    data = request.get_json()
    
    if 'term' in data:
        card.term = data['term']
    if 'definition' in data:
        card.definition = data['definition']
    if 'example' in data:
        card.example = data['example']
    
    db.session.commit()
    
    return jsonify(card.to_dict())


@cards_bp.route('/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    """Удалить карточку."""
    card = Card.query.get_or_404(card_id)
    db.session.delete(card)
    db.session.commit()
    
    return jsonify({'message': 'Card deleted'})


# =============================================================================
# Режимы обучения
# =============================================================================

@cards_bp.route('/study/<int:module_id>', methods=['GET'])
def get_next_card(module_id):
    """
    Получить следующую карточку для изучения (Flashcards режим).
    
    Логика выбора:
    1. Приоритет карточкам с низким % успеха (< 70%)
    2. Затем карточкам которые давно не просматривались (> 7 дней)
    3. Затем новым карточкам (last_reviewed is None)
    4. Иначе случайная карточка
    
    Query params:
        user_id: ID пользователя (для записи в лог)
    """
    user_id = request.args.get('user_id', type=int)
    module = Module.query.get_or_404(module_id)
    
    cards = module.cards.all()
    if not cards:
        return jsonify({'message': 'No cards in module', 'card': None})
    
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    
    # Приоритет 1: Карточки с низким success rate
    low_success = [c for c in cards if c.get_success_rate() is not None and c.get_success_rate() < 70]
    
    # Приоритет 2: Карточки которые давно не смотрели
    old_review = [c for c in cards if c.last_reviewed and c.last_reviewed < week_ago]
    
    # Приоритет 3: Новые карточки
    new_cards = [c for c in cards if c.last_reviewed is None]
    
    # Выбираем приоритетную группу
    if low_success:
        card = random.choice(low_success)
    elif old_review:
        card = random.choice(old_review)
    elif new_cards:
        card = random.choice(new_cards)
    else:
        card = random.choice(cards)
    
    return jsonify({
        'card': card.to_dict(),
        'progress': {
            'reviewed': sum(1 for c in cards if c.last_reviewed is not None),
            'total': len(cards)
        }
    })


@cards_bp.route('/<int:card_id>/record', methods=['POST'])
def record_result(card_id):
    """
    Записать результат изучения карточки.
    
    Body:
        user_id: ID пользователя
        result: 'success' или 'fail' (или boolean is_success)
    """
    card = Card.query.get_or_404(card_id)
    data = request.get_json()
    
    user_id = data.get('user_id', 1)  # Хардкодим для MVP
    
    # Определяем результат
    if 'is_success' in data:
        is_success = data['is_success']
    elif 'result' in data:
        is_success = data['result'] == 'success'
    else:
        return jsonify({'error': 'Missing result or is_success field'}), 400
    
    # Обновляем статистику карточки
    card.record_result(is_success)
    
    # Создаем запись в журнале
    log = StudyLog.create(user_id=user_id, card=card, is_success=is_success)
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Result recorded',
        'card': card.to_dict(),
        'success_rate': card.get_success_rate()
    })


@cards_bp.route('/review/<int:module_id>', methods=['GET'])
def get_cards_for_review(module_id):
    """
    Работа над ошибками.
    
    Возвращает карточки с высоким error_count или низким success_rate.
    
    Query params:
        limit: Максимальное количество карточек (default: 10)
        min_errors: Минимальное количество ошибок для включения (default: 1)
    """
    module = Module.query.get_or_404(module_id)
    limit = request.args.get('limit', 10, type=int)
    min_errors = request.args.get('min_errors', 1, type=int)
    
    cards = module.cards.all()
    
    # Фильтруем карточки с ошибками
    needs_review = []
    for card in cards:
        if card.error_count >= min_errors:
            success_rate = card.get_success_rate()
            # Включаем если success_rate < 70% или None (еще не было успешных попыток)
            if success_rate is None or success_rate < 70:
                needs_review.append(card)
    
    # Сортируем по приоритету (больше ошибок + ниже success rate)
    needs_review.sort(key=lambda c: (
        -c.error_count,  # Больше ошибок = выше приоритет
        c.get_success_rate() or 0  # Ниже success rate = выше приоритет
    ))
    
    return jsonify({
        'cards': [c.to_dict() for c in needs_review[:limit]],
        'total_needs_review': len(needs_review)
    })


@cards_bp.route('/quiz/<int:module_id>', methods=['GET'])
def get_quiz_data(module_id):
    """
    Данные для теста с выбором варианта.
    
    Возвращает карточку + 3 неправильных варианта из того же модуля.
    
    Query params:
        card_id: Конкретная карточка для теста (опционально)
    """
    module = Module.query.get_or_404(module_id)
    card_id = request.args.get('card_id', type=int)
    
    cards = module.cards.all()
    
    if len(cards) < 4:
        return jsonify({
            'error': 'Not enough cards for quiz. Need at least 4 cards.'
        }), 400
    
    # Выбираем карточку для вопроса
    if card_id:
        question_card = Card.query.get(card_id)
        if not question_card or question_card.module_id != module_id:
            return jsonify({'error': 'Card not found in module'}), 404
    else:
        question_card = random.choice(cards)
    
    # Выбираем 3 неправильных варианта
    other_cards = [c for c in cards if c.id != question_card.id]
    wrong_options = random.sample(other_cards, min(3, len(other_cards)))
    
    # Формируем варианты ответов
    options = wrong_options + [question_card]
    random.shuffle(options)
    
    return jsonify({
        'question': {
            'card_id': question_card.id,
            'term': question_card.term,
            'example': question_card.example
        },
        'options': [
            {
                'card_id': c.id,
                'definition': c.definition
            } for c in options
        ],
        'correct_answer': question_card.id
    })


@cards_bp.route('/<int:module_id>/progress', methods=['GET'])
def get_learning_progress(module_id):
    """
    Получить прогресс обучения по модулю.
    
    Returns:
        - Сколько карточек изучено
        - Общий % успеха
        - Распределение по уровням сложности
    """
    module = Module.query.get_or_404(module_id)
    cards = module.cards.all()
    
    if not cards:
        return jsonify({
            'module_id': module_id,
            'total_cards': 0,
            'message': 'No cards in module'
        })
    
    # Категоризация карточек
    mastered = []      # success_rate >= 90% и error_count < 3
    learning = []      # 50% <= success_rate < 90%
    difficult = []     # success_rate < 50% или error_count > success_count
    new = []           # еще не изучались
    
    for card in cards:
        success_rate = card.get_success_rate()
        total_reviews = card.success_count + card.error_count
        
        if total_reviews == 0:
            new.append(card)
        elif success_rate is not None:
            if success_rate >= 90 and card.error_count <= 3:
                mastered.append(card)
            elif success_rate >= 50:
                learning.append(card)
            else:
                difficult.append(card)
        else:
            new.append(card)
    
    total_reviews = sum(c.success_count + c.error_count for c in cards)
    total_success = sum(c.success_count for c in cards)
    
    return jsonify({
        'module_id': module_id,
        'total_cards': len(cards),
        'total_reviews': total_reviews,
        'overall_success_rate': round((total_success / total_reviews * 100), 1) if total_reviews > 0 else None,
        'progress': {
            'mastered': len(mastered),
            'learning': len(learning),
            'difficult': len(difficult),
            'new': len(new)
        },
        'cards_to_review': len(difficult) + len([c for c in new if c.last_reviewed is None])
    })
