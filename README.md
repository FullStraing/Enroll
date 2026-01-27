# Enroll (MVP backend)

## Что это
Backend для MVP платформы поступления (CIS → USA) на Django + DRF. Проект организован вокруг приложений `core`, `users`, `universities`, подключённых в `INSTALLED_APPS`.【F:backend/config/settings.py†L31-L46】

Базовый API префикс: `/api/`, а административная панель доступна по `/admin/`.【F:backend/config/urls.py†L1-L7】

## Быстрый старт (локально)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver
```

> При отсутствии Django в окружении запуск `manage.py` выдаст ошибку импорта.【F:backend/manage.py†L7-L17】

## Аутентификация

Проект использует JWT-аутентификацию по умолчанию и требует авторизацию для большинства эндпоинтов.【F:backend/config/settings.py†L113-L119】

Доступные эндпоинты:
- `POST /api/auth/token/` — получение пары токенов.
- `POST /api/auth/token/refresh/` — обновление токена.【F:backend/apps/core/urls.py†L22-L28】

## Основные модули

- **Users**: регистрация и профиль студента (`/api/auth/register/`, `/api/auth/profile/`).【F:backend/apps/users/urls.py†L1-L7】
- **Universities**: список вузов, “мои университеты” и Applications API.【F:backend/apps/universities/urls.py†L1-L14】
- **Core**: системные эндпоинты `ping` и `me`.【F:backend/apps/core/urls.py†L12-L29】

## Структура профиля студента (MVP)

Поля профиля включают оценки/тесты, активности, награды, бюджет и пр., хранящиеся в модели `StudentProfile`.【F:backend/apps/users/models.py†L5-L80】

## Документация

- Архитектура: `docs/ARCHITECTURE.md`
- API: `docs/API.md`

## Быстрая проверка Applications через браузер

Откройте `http://127.0.0.1:8000/applications-ui/` и вставьте JWT access token, затем загрузите список и создайте запись. Страница работает поверх `/api/applications/`.【F:backend/config/urls.py†L1-L8】【F:backend/apps/universities/urls.py†L1-L14】
