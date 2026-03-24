"""
WSGI entry point.

Точка входа для production сервера (gunicorn, waitress).

Запуск:
    gunicorn "wsgi:app"
    # или для Windows:
    waitress-serve --host=127.0.0.1 --port=5000 wsgi:app
"""

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug = True, host='0.0.0.0', port=5000)
