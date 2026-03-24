"""
Расширения Flask.

Вынесены в отдельный модуль для избежания циклических импортов.
Инициализируются здесь, а подключаются в create_app().
"""

from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate

db = SQLAlchemy()
ma = Marshmallow()
migrate = Migrate()
