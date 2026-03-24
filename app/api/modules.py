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

modules_bp = Blueprint('modules', __name__)


@modules_bp.route('', methods=['GET'])
def get_modules():
    """
    Получить список модулей.
    
    Query params:
        user_id: Фильтр по владельцу
        is_public: Фильтр по публичности (true/false)
        page: Номер страницы
        per_page: Количество на странице
    """
    user_id = request.args.get('user_id', type=int)
    is_public = request.args.get('is_public')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', current_app.config.get('MODULES_PER_PAGE', 10), type=int)
    
    query = Module.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    if is_public is not None:
        query = query.filter_by(is_public=is_public.lower() == 'true')
    
    # Сортировка: сначала свои, потом публичные, по дате обновления
    query = query.order_by(Module.updated_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'modules': [m.to_dict() for m in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@modules_bp.route('/<int:module_id>', methods=['GET'])
def get_module(module_id):
    """Получить детали модуля с карточками."""
    module = Module.query.get_or_404(module_id)
    return jsonify(module.to_dict(include_cards=True))


@modules_bp.route('', methods=['POST'])
def create_module():
    """
    Создать новый модуль.
    
    Body:
        title: Название модуля
        description: Описание (опционально)
        user_id: ID владельца (пока хардкодим)
        is_public: Публичный или нет (default: false)
    """
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    module = Module(
        title=data['title'],
        description=data.get('description', ''),
        user_id=data.get('user_id', 1),  # Хардкодим user_id=1 для MVP
        is_public=data.get('is_public', False)
    )
    
    db.session.add(module)
    db.session.commit()
    
    return jsonify(module.to_dict()), 201


@modules_bp.route('/<int:module_id>', methods=['PUT'])
def update_module(module_id):
    """Обновить модуль."""
    module = Module.query.get_or_404(module_id)
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
def delete_module(module_id):
    """Удалить модуль."""
    module = Module.query.get_or_404(module_id)
    db.session.delete(module)
    db.session.commit()
    
    return jsonify({'message': 'Module deleted'})


@modules_bp.route('/<int:module_id>/clone', methods=['POST'])
def clone_module(module_id):
    """
    Клонировать модуль.
    
    Создает копию модуля со всеми карточками для текущего пользователя.
    Нужно для изоляции прогресса обучения.
    """
    source = Module.query.get_or_404(module_id)
    data = request.get_json() or {}
    
    # Создаем клон модуля
    clone = Module(
        title=f"{source.title} (copy)",
        description=source.description,
        user_id=data.get('user_id', 1),  # Хардкодим для MVP
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
def import_csv(module_id):
    """
    Импорт карточек из CSV файла.
    
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
def get_module_stats(module_id):
    """
    Получить статистику модуля.
    
    Returns:
        - Общее количество карточек
        - Процент успеха
        - Карточки с наибольшим количеством ошибок
    """
    module = Module.query.get_or_404(module_id)
    
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
