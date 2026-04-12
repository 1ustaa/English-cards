"""
Marshmallow schemas для API валидации.

Схемы для регистрации, входа и других операций.
"""

from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):
    """Схема для регистрации пользователя."""
    
    username = fields.String(
        required=True,
        validate=[
            validate.Length(min=3, max=64),
            validate.Regexp(
                r'^[a-zA-Z0-9_]+$',
                error='Username can only contain letters, numbers and underscores'
            )
        ]
    )
    email = fields.Email(required=True)
    password = fields.String(
        required=True,
        validate=validate.Length(min=6, max=128)
    )


class LoginSchema(Schema):
    """Схема для входа пользователя."""
    
    email = fields.Email(required=True)
    password = fields.String(required=True)


class UserUpdateSchema(Schema):
    """Схема для обновления профиля пользователя."""
    
    username = fields.String(
        validate=[
            validate.Length(min=3, max=64),
            validate.Regexp(
                r'^[a-zA-Z0-9_]+$',
                error='Username can only contain letters, numbers and underscores'
            )
        ]
    )
    email = fields.Email()
