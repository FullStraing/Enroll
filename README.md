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

## Next.js frontend (инкрементальная миграция без поломки текущего UI)

Текущий Django UI продолжает работать как раньше на `http://127.0.0.1:8000/*`.

Новый frontend вынесен в отдельную папку `frontend/` и запускается параллельно:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

После запуска:
- Next.js: `http://127.0.0.1:3000`
- Django: `http://127.0.0.1:8000`

Next.js использует существующий backend API (`/api/*`) и JWT-механику проекта.

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

- `http://127.0.0.1:8000/` — публичный лендинг Enroll AI.
- `http://127.0.0.1:8000/register` — регистрация.
- `http://127.0.0.1:8000/login` — вход.
- `http://127.0.0.1:8000/dashboard/` — основная точка входа.
- `http://127.0.0.1:8000/onboarding/` — заполнение профиля.
- `http://127.0.0.1:8000/applications/` — управление списком университетов.
- `http://127.0.0.1:8000/tasks/` — задачи и генерация чеклиста.
- `http://127.0.0.1:8000/documents/` — документы и версии.
- `http://127.0.0.1:8000/common-app/` — Common App Draft (AI stub).
- `http://127.0.0.1:8000/app/` — API‑консоль.
- `http://127.0.0.1:8000/applications-ui/` — минимальная форма для Applications API.

Откройте `/app/` и выполните регистрацию/логин, затем используйте UI для демонстрации API. Страница `/applications-ui/` оставлена как простой тестовый экран для Applications. 【F:backend/config/urls.py†L1-L9】【F:backend/apps/universities/urls.py†L1-L14】
