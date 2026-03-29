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

    Возвращает карточку + варианты ответов из того же модуля.
    Адаптируется под количество карточек в модуле.

    Query params:
        card_id: Конкретная карточка для теста (опционально)
    """
    module = Module.query.get_or_404(module_id)
    card_id = request.args.get('card_id', type=int)

    cards = module.cards.all()

    if len(cards) == 0:
        return jsonify({
            'error': 'В модуле нет карточек. Добавьте карточки перед прохождением теста.',
            'error_code': 'no_cards'
        }), 400

    # Выбираем карточку для вопроса
    if card_id:
        question_card = Card.query.get(card_id)
        if not question_card or question_card.module_id != module_id:
            return jsonify({'error': 'Карточка не найдена в модуле'}), 404
    else:
        question_card = random.choice(cards)

    # Выбираем неправильные варианты (все остальные карточки)
    other_cards = [c for c in cards if c.id != question_card.id]
    
    # Если карточек больше 3, выбираем случайно 3, иначе берём все доступные
    if len(other_cards) >= 3:
        wrong_options = random.sample(other_cards, 3)
    else:
        wrong_options = other_cards
    
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
        'correct_answer': question_card.id,
        'total_options': len(options),
        'message': len(options) < 4 and 'Мало карточек в модуле. Для лучшего теста добавьте ещё карточек.' or None
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


@cards_bp.route('/<int:module_id>/study-session', methods=['POST'])
def start_study_session(module_id):
    """
    Начать сессию заучивания.
    
    Генерирует вопросы: 2× количество карточек
    - 50% вопросов: выбор варианта (термин → определение)
    - 50% вопросов: ручной ввод (определение → термин)
    
    Returns:
        session_id и список вопросов
    """
    import random
    import uuid
    
    module = Module.query.get_or_404(module_id)
    cards = module.cards.all()
    
    if len(cards) < 2:
        return jsonify({
            'error': 'Недостаточно карточек для заучивания. Минимум 2 карточки.'
        }), 400
    
    # Генерируем вопросы
    questions = []
    question_id = 0
    
    # Для каждой карточки создаем 2 вопроса
    for card in cards:
        # Вопрос 1: Выбор варианта (термин → определение)
        other_definitions = [c.definition for c in cards if c.id != card.id]
        wrong_options = random.sample(other_definitions, min(3, len(other_definitions)))
        options = wrong_options + [card.definition]
        random.shuffle(options)
        
        questions.append({
            'questionId': question_id,
            'type': 'multiple_choice',
            'cardId': card.id,
            'term': card.term,
            'definition': card.definition,
            'correctAnswer': card.definition,
            'options': options,
        })
        question_id += 1
        
        # Вопрос 2: Ручной ввод (определение → термин)
        questions.append({
            'questionId': question_id,
            'type': 'text_input',
            'cardId': card.id,
            'term': card.term,
            'definition': card.definition,
            'correctAnswer': card.term,
        })
        question_id += 1
    
    # Перемешиваем вопросы
    random.shuffle(questions)
    
    # Создаем сессию (временную, в памяти для MVP)
    session_id = str(uuid.uuid4())
    
    # В будущем можно сохранить сессию в БД
    # Для MVP храним в app.config (в памяти)
    if not hasattr(current_app, 'study_sessions'):
        current_app.study_sessions = {}
    
    current_app.study_sessions[session_id] = {
        'module_id': module_id,
        'questions': questions,
        'answers': [],
        'started_at': datetime.now(timezone.utc),
    }
    
    return jsonify({
        'sessionId': session_id,
        'totalQuestions': len(questions),
        'questions': questions,
    })


@cards_bp.route('/study-session/<session_id>/check', methods=['POST'])
def check_answer(session_id):
    """
    Проверить ответ на вопрос.
    
    Body:
        questionId: ID вопроса
        answer: Ответ пользователя
    """
    from app import create_app
    
    data = request.get_json()
    question_id = data.get('questionId')
    user_answer = data.get('answer', '').strip()
    
    # Получаем сессию
    if not hasattr(current_app, 'study_sessions'):
        return jsonify({'error': 'Сессия не найдена'}), 404
    
    session = current_app.study_sessions.get(session_id)
    if not session:
        return jsonify({'error': 'Сессия не найдена'}), 404
    
    # Находим вопрос
    question = None
    for q in session['questions']:
        if q['questionId'] == question_id:
            question = q
            break
    
    if not question:
        return jsonify({'error': 'Вопрос не найден'}), 404
    
    # Проверяем ответ
    correct_answer = question['correctAnswer'].strip().lower()
    user_answer_normalized = user_answer.lower()
    
    is_correct = False
    
    if question['type'] == 'multiple_choice':
        is_correct = user_answer_normalized == correct_answer
    else:  # text_input
        # Используем расстояние Левенштейна для проверки
        is_correct = check_text_similarity(user_answer_normalized, correct_answer)
    
    # Сохраняем ответ
    answer_result = {
        'questionId': question_id,
        'userAnswer': user_answer,
        'correctAnswer': question['correctAnswer'],
        'isCorrect': is_correct,
    }
    session['answers'].append(answer_result)
    
    return jsonify({
        'isCorrect': is_correct,
        'correctAnswer': question['correctAnswer'],
    })


@cards_bp.route('/study-session/<session_id>/hint', methods=['GET'])
def get_hint(session_id):
    """
    Получить подсказку для текущего вопроса.
    
    Query params:
        questionId: ID вопроса
    """
    question_id = request.args.get('questionId', type=int)
    
    # Получаем сессию
    if not hasattr(current_app, 'study_sessions'):
        return jsonify({'error': 'Сессия не найдена'}), 404
    
    session = current_app.study_sessions.get(session_id)
    if not session:
        return jsonify({'error': 'Сессия не найдена'}), 404
    
    # Находим вопрос
    question = None
    for q in session['questions']:
        if q['questionId'] == question_id:
            question = q
            break
    
    if not question:
        return jsonify({'error': 'Вопрос не найден'}), 404
    
    correct_answer = question['correctAnswer']
    
    # Генерируем подсказку: первая буква + количество букв
    hint = correct_answer[0] if correct_answer else ''
    hint_display = f"{correct_answer[0]}{'_' * (len(correct_answer) - 1)}" if correct_answer else ''
    
    return jsonify({
        'hint': hint,
        'hintDisplay': hint_display,
        'firstLetter': correct_answer[0] if correct_answer else '',
        'length': len(correct_answer),
    })


@cards_bp.route('/study-session/<session_id>/finish', methods=['POST'])
def finish_study_session(session_id):
    """
    Завершить сессию заучивания.
    
    Returns:
        Статистика сессии
    """
    # Получаем сессию
    if not hasattr(current_app, 'study_sessions'):
        return jsonify({'error': 'Сессия не найдена'}), 404
    
    session = current_app.study_sessions.get(session_id)
    if not session:
        return jsonify({'error': 'Сессия не найдена'}), 404
    
    # Подсчитываем результаты
    answers = session['answers']
    total = len(answers)
    correct = sum(1 for a in answers if a['isCorrect'])
    incorrect = total - correct
    
    # Сохраняем результаты в StudyLog (опционально)
    # Для MVP просто возвращаем статистику
    
    # Удаляем сессию
    del current_app.study_sessions[session_id]
    
    return jsonify({
        'total': total,
        'correct': correct,
        'incorrect': incorrect,
        'percentage': round((correct / total * 100), 1) if total > 0 else 0,
        'answers': answers,
    })


def check_text_similarity(user_answer: str, correct_answer: str) -> bool:
    """
    Проверить схожесть текста с допуском опечаток.
    
    Использует расстояние Левенштейна.
    Допускает до 2 ошибок на слово.
    """
    # Полное совпадение
    if user_answer == correct_answer:
        return True
    
    # Вычисляем расстояние Левенштейна
    distance = levenshtein_distance(user_answer, correct_answer)
    
    # Допускаем до 2 ошибок
    return distance <= 2


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Вычислить расстояние Левенштейна между двумя строками.
    
    Количество редактирований (вставка, удаление, замена) для превращения s1 в s2.
    """
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]
