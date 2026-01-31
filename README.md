# Enroll (MVP backend)

## Что это

Backend для MVP платформы поступления (CIS → USA) на Django + DRF. Проект организован вокруг приложений `core`, `users`, `universities`, `tasks`, `documents`, `ai`, подключённых в `INSTALLED_APPS`.【F:backend/config/settings.py†L31-L46】

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
- **Tasks**: roadmap‑этапы и задачи (`/api/tasks/`, `/api/tasks/generate/`).【F:backend/apps/tasks/urls.py†L1-L7】
- **Documents**: документы и версии (`/api/documents/`, `/api/documents/<id>/versions/`).【F:backend/apps/documents/urls.py†L1-L9】
- **AI**: stub‑эндпоинты (`/api/ai/*`).【F:backend/apps/ai/urls.py†L1-L9】

## Структура профиля студента (MVP)

Поля профиля включают оценки/тесты, активности, награды, бюджет и пр., хранящиеся в модели `StudentProfile`.【F:backend/apps/users/models.py†L5-L80】

## Документация

- Архитектура: `docs/ARCHITECTURE.md`
- API: `docs/API.md`

## Быстрая проверка через браузер

- `http://127.0.0.1:8000/app/` — основная MVP‑консоль (Auth, Profile, Universities, My Universities, Applications, Tasks, Documents, AI).
- `http://127.0.0.1:8000/applications-ui/` — минимальная форма для Applications API.

Откройте `/app/` и выполните регистрацию/логин, затем используйте UI для демонстрации API. Страница `/applications-ui/` оставлена как простой тестовый экран для Applications. 【F:backend/config/urls.py†L1-L9】【F:backend/apps/universities/urls.py†L1-L14】
