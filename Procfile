web: gunicorn config.wsgi:application --chdir backend --bind 0.0.0.0:${PORT:-8000}
worker: celery --workdir backend -A config worker -l info
