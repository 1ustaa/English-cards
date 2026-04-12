"""
API Blueprint для модулей (Decks).

Endpoints:
    GET    /modules              - Список модулей (с фильтрацией по is_public)
    GET    /modules/<id>         - Детали модуля
    POST   /modules              - Создать модуль
    PUT    /modules/<id>         - Обновить модуль
    DELETE /modules/<id>         - Удалить модуль
    POST   /modules/<id>/clone   - Клонировать модуль
    POST   /modules/<id>/import  - Импорт карточек из CSV
"""

from flask import Blueprint, request, jsonify, current_app
from typing import Any, Dict

from app.extensions import db
from app.models import Module, Card, User
from app.api.auth import token_required

modules_bp = Blueprint('modules', __name__)


@modules_bp.route('', methods=['GET'])
@token_required
def get_modules(current_user):
    """
    Получить список модулей текущего пользователя.

    Query params:
        is_public: Фильтр по публичности (true/false)
        page: Номер страницы
        per_page: Количество на странице
    """
    is_public = request.args.get('is_public')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', current_app.config.get('MODULES_PER_PAGE', 10), type=int)

    # Показываем только модули текущего пользователя
    query = Module.query.filter_by(user_id=current_user.id)

    if is_public is not None:
        query = query.filter_by(is_public=is_public.lower() == 'true')

    # Сортировка: по дате обновления
    query = query.order_by(Module.updated_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'modules': [m.to_dict() for m in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@modules_bp.route('/<int:module_id>', methods=['GET'])
@token_required
def get_module(current_user, module_id):
    """Получить детали модуля с карточками. Проверяет права доступа."""
    module = Module.query.get_or_404(module_id)
    
    # Проверяем что модуль принадлежит пользователю или является публичным
    if module.user_id != current_user.id and not module.is_public:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify(module.to_dict(include_cards=True))


@modules_bp.route('', methods=['POST'])
@token_required
def create_module(current_user):
    """
    Создать новый модуль.

    Body:
        title: Название модуля
        description: Описание (опционально)
        is_public: Публичный или нет (default: false)
    """
    data = request.get_json()

    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400

    module = Module(
        title=data['title'],
        description=data.get('description', ''),
        user_id=current_user.id,
        is_public=data.get('is_public', False)
    )

    db.session.add(module)
    db.session.commit()

    return jsonify(module.to_dict()), 201


@modules_bp.route('/<int:module_id>', methods=['PUT'])
@token_required
def update_module(current_user, module_id):
    """Обновить модуль. Только владелец может обновлять."""
    module = Module.query.get_or_404(module_id)
    
    # Проверяем права доступа
    if module.user_id != current_user.id:
        return jsonify({'error': 'Only owner can update module'}), 403
    
    data = request.get_json()

    if 'title' in data:
        module.title = data['title']
    if 'description' in data:
        module.description = data['description']
    if 'is_public' in data:
        module.is_public = data['is_public']

    db.session.commit()

    return jsonify(module.to_dict())


@modules_bp.route('/<int:module_id>', methods=['DELETE'])
@token_required
def delete_module(current_user, module_id):
    """Удалить модуль. Только владелец может удалять."""
    module = Module.query.get_or_404(module_id)
    
    # Проверяем права доступа
    if module.user_id != current_user.id:
        return jsonify({'error': 'Only owner can delete module'}), 403
    
    db.session.delete(module)
    db.session.commit()

    return jsonify({'message': 'Module deleted'})


@modules_bp.route('/<int:module_id>/clone', methods=['POST'])
@token_required
def clone_module(current_user, module_id):
    """
    Клонировать модуль.

    Создает копию модуля со всеми карточками для текущего пользователя.
    Нужно для изоляции прогресса обучения.
    """
    source = Module.query.get_or_404(module_id)
    data = request.get_json() or {}

    # Создаем клон модуля для текущего пользователя
    clone = Module(
        title=f"{source.title} (copy)",
        description=source.description,
        user_id=current_user.id,
        is_public=False,  # Клон всегда приватный
        cloned_from_id=source.id
    )
    db.session.add(clone)
    db.session.flush()  # Получаем ID клона

    # Копируем карточки
    for card in source.cards.all():
        card_clone = Card(
            module_id=clone.id,
            term=card.term,
            definition=card.definition,
            example=card.example,
            error_count=0,  # Сбрасываем статистику
            success_count=0
        )
        db.session.add(card_clone)

    db.session.commit()

    return jsonify(clone.to_dict()), 201


@modules_bp.route('/<int:module_id>/import', methods=['POST'])
@token_required
def import_csv(current_user, module_id):
    """
    Импорт карточек из CSV файла. Только владелец модуля может импортировать.

    Формат CSV: "Слово;Перевод;Пример"
    Пример:
        Apple;Яблоко;I eat an apple
        Book;Книга;She reads a book

    Query params:
        has_header: Есть ли заголовок в файле (default: false)
    """
    import csv
    import io

    module = Module.query.get_or_404(module_id)
    
    # Проверяем права доступа
    if module.user_id != current_user.id:
        return jsonify({'error': 'Only owner can import cards'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Проверка размера
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset
    
    max_size = current_app.config.get('MAX_CSV_FILE_SIZE', 5 * 1024 * 1024)
    if file_size > max_size:
        return jsonify({'error': f'File too large. Max size: {max_size} bytes'}), 400
    
    has_header = request.args.get('has_header', 'false').lower() == 'true'
    delimiter = current_app.config.get('CSV_DELIMITER', ';')
    
    # Читаем CSV
    try:
        stream = io.StringIO(file.stream.read().decode('UTF-8'))
        reader = csv.reader(stream, delimiter=delimiter)
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(reader, start=1):
            # Пропускаем заголовок
            if row_num == 1 and has_header:
                continue
            
            if len(row) < 2:
                errors.append(f'Row {row_num}: Not enough columns (need at least term and definition)')
                continue
            
            term = row[0].strip()
            definition = row[1].strip()
            example = row[2].strip() if len(row) > 2 else None
            
            if not term or not definition:
                errors.append(f'Row {row_num}: Term and definition cannot be empty')
                continue
            
            card = Card(
                module_id=module.id,
                term=term,
                definition=definition,
                example=example
            )
            db.session.add(card)
            imported_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Imported {imported_count} cards',
            'imported_count': imported_count,
            'errors': errors if errors else None
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Import failed: {str(e)}'}), 500


@modules_bp.route('/<int:module_id>/stats', methods=['GET'])
@token_required
def get_module_stats(current_user, module_id):
    """
    Получить статистику модуля. Только для владельца.

    Returns:
        - Общее количество карточек
        - Процент успеха
        - Карточки с наибольшим количеством ошибок
    """
    module = Module.query.get_or_404(module_id)
    
    # Проверяем права доступа
    if module.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    cards = module.cards.all()
    total_cards = len(cards)
    
    # Топ карточек по ошибкам
    worst_cards = module.cards.order_by(Card.error_count.desc()).limit(5).all()
    
    # Карточки для повторения (высокий error_count или низкий success_rate)
    needs_review = []
    for card in cards:
        success_rate = card.get_success_rate()
        if card.error_count > 0 and (success_rate is None or success_rate < 70):
            needs_review.append(card.to_dict())
    
    return jsonify({
        'module_id': module.id,
        'total_cards': total_cards,
        'success_rate': module.get_success_rate(),
        'total_reviews': sum(c.success_count + c.error_count for c in cards),
        'worst_cards': [c.to_dict() for c in worst_cards],
        'needs_review': needs_review[:10]  # Топ 10
    })


@modules_bp.route('/<int:module_id>/study-session', methods=['POST'])
@token_required
def start_study_session(current_user, module_id):
    """
    Начать сессию заучивания. Только для владельца модуля.

    Генерирует вопросы: 2× количество карточек
    - 50% вопросов: выбор варианта (термин → определение)
    - 50% вопросов: ручной ввод (определение → термин)

    Returns:
        session_id и список вопросов
    """
    import random
    import uuid
    from datetime import datetime, timezone

    module = Module.query.get_or_404(module_id)
    
    # Проверяем права доступа
    if module.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
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


@modules_bp.route('/study-session/<session_id>/check', methods=['POST'])
def check_answer(session_id):
    """
    Проверить ответ на вопрос.
    
    Body:
        questionId: ID вопроса
        answer: Ответ пользователя
    """
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


@modules_bp.route('/study-session/<session_id>/hint', methods=['GET'])
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
    
    # Генерируем подсказку: показываем первую половину слова
    length = len(correct_answer)
    half_length = max(1, (length + 1) // 2)  # Округляем вверх
    visible_part = correct_answer[:half_length]
    hidden_part = '_' * (length - half_length)
    hint_display = f"{visible_part}{hidden_part}"
    
    return jsonify({
        'hint': visible_part,
        'hintDisplay': hint_display,
        'visiblePart': visible_part,
        'hiddenLength': length - half_length,
        'length': length,
    })


@modules_bp.route('/study-session/<session_id>/finish', methods=['POST'])
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
