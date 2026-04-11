"""
Скрипт для управления миграциями базы данных.

Использование:
    python db.py migrate   - Создать миграцию
    python db.py upgrade   - Применить миграции
    python db.py downgrade - Откатить миграцию
"""

import sys
import os

# Добавляем проект в path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from flask_migrate import Migrate, migrate, upgrade, downgrade, current, history, stamp

# Создаём приложение
app = create_app(config_name='default')

# Инициализируем миграции
migrate_obj = Migrate(app, db)

def print_help():
    print(__doc__)
    print("\nДоступные команды:")
    print("  python db.py migrate -m 'Описание'  - Создать миграцию")
    print("  python db.py upgrade                - Применить миграции")
    print("  python db.py downgrade -1           - Откатить миграцию")
    print("  python db.py current                - Текущая версия")
    print("  python db.py history                - История")
    print("  python db.py stamp head             - Отметить как последнюю версию")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print_help()
        sys.exit(0)
    
    command = sys.argv[1]
    
    with app.app_context():
        if command == 'migrate':
            message = sys.argv[2] if len(sys.argv) > 2 else 'Auto generated migration'
            migrate(message=message)
            print("\n✅ Миграция создана. Проверьте файлы в migrations/versions/")
            
        elif command == 'upgrade':
            revision = sys.argv[2] if len(sys.argv) > 2 else 'head'
            upgrade(revision)
            print("\n✅ Миграции применены.")
            
        elif command == 'downgrade':
            revision = sys.argv[2] if len(sys.argv) > 2 else '-1'
            downgrade(revision)
            print("\n✅ Миграция откатана.")
            
        elif command == 'current':
            current()
            
        elif command == 'history':
            history()
            
        elif command == 'stamp':
            revision = sys.argv[2] if len(sys.argv) > 2 else 'head'
            stamp(revision)
            print(f"\n✅ БД отмечена как версия {revision}.")
            
        else:
            print(f"❌ Неизвестная команда: {command}")
            print_help()
            sys.exit(1)
