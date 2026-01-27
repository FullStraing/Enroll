# Архитектура (MVP)

## Обзор

Backend построен на Django + DRF. Конфигурация в `config`, приложения расположены в `apps/` и подключены в `INSTALLED_APPS`: `core`, `users`, `universities`.【F:backend/config/settings.py†L31-L46】

Корневой роутинг включает `/admin/` и `/api/`, а дальше маршруты распределяются по приложениям.【F:backend/config/urls.py†L1-L7】

## Приложения

### `apps.core`

Содержит системные эндпоинты:
- `/api/ping/` для healthcheck,
- `/api/me/` для получения текущего пользователя,
- JWT-эндпоинты `/api/auth/token/` и `/api/auth/token/refresh/`.
【F:backend/apps/core/urls.py†L12-L28】

### `apps.users`

- Регистрация пользователя (`RegisterView`) и профиль (`StudentProfileView`).【F:backend/apps/users/views.py†L7-L19】
- `StudentProfile` хранит ключевые поля профиля: оценки, тесты, активности, награды, бюджет и др.【F:backend/apps/users/models.py†L5-L80】

### `apps.universities`

- `University` хранит базовые сведения о вузе; `StudentUniversity` — связь студента с университетом и прогресс по заявке; `Application` — MVP‑заявка студента с дедлайном и статусом.【F:backend/apps/universities/models.py†L5-L158】
- Вьюхи предоставляют чтение/обновление списков университетов и Applications API.【F:backend/apps/universities/views.py†L6-L58】

## Аутентификация и доступ

По умолчанию используется JWT-аутентификация, а доступ ограничен `IsAuthenticated` на уровне DRF, кроме регистрационных эндпоинтов.【F:backend/config/settings.py†L113-L119】【F:backend/apps/users/views.py†L7-L10】

## Текущий статус MVP

На данный момент реализованы: регистрация, профиль студента, справочник университетов, Applications API и минимальная браузерная форма для проверок. Дальнейшие шаги — задачи, документы, генерация AI черновиков (см. `docs/API.md`).【F:backend/apps/users/urls.py†L1-L7】【F:backend/apps/universities/urls.py†L1-L14】【F:backend/config/urls.py†L1-L9】
