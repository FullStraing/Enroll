# API (MVP)

Базовый префикс API: `/api/`.【F:backend/config/urls.py†L1-L7】

## Реализовано сейчас

### Auth
- `POST /api/auth/register/` — регистрация пользователя.【F:backend/apps/users/urls.py†L1-L7】
- `POST /api/auth/token/` — получение JWT.
- `POST /api/auth/token/refresh/` — refresh токена.【F:backend/apps/core/urls.py†L22-L28】
- `GET /api/me/` — текущий пользователь (JWT required).【F:backend/apps/core/urls.py†L16-L25】

### Student Profile
- `GET /api/auth/profile/` — получить профиль студента.【F:backend/apps/users/urls.py†L1-L7】
- `PUT /api/auth/profile/` — обновить профиль студента.【F:backend/apps/users/urls.py†L1-L7】

Поля профиля хранятся в модели `StudentProfile` (включая тесты, активности и бюджет).【F:backend/apps/users/models.py†L5-L80】

### Universities
- `GET /api/universities/` — список вузов.
- `GET /api/universities/<id>/` — детали вуза.
- `GET /api/my-universities/` — личный список.
- `POST /api/my-universities/` — добавить вуз в личный список.
- `GET /api/my-universities/<id>/` / `PUT` / `DELETE` — управление записью.
【F:backend/apps/universities/urls.py†L1-L14】

### Applications
- `GET /api/applications/` — список заявок пользователя.
- `POST /api/applications/` — создать заявку (только university_id из “My Universities”).
- `GET /api/applications/<id>/` — детали заявки.
- `PUT /api/applications/<id>/` — обновить статус/дедлайн.
【F:backend/apps/universities/urls.py†L1-L14】

### Tasks
- `GET /api/tasks?status=&application_id=` — список задач пользователя.
- `POST /api/tasks` — создать задачу вручную.
- `POST /api/tasks/generate` — генерация задач из шаблонов.
- `PUT /api/tasks/:id` — обновить задачу.
【F:backend/apps/tasks/urls.py†L1-L7】

### Documents + Versions
- `GET /api/documents`
- `POST /api/documents`
- `GET /api/documents/:id`
- `POST /api/documents/:id/versions`
- `GET /api/documents/:id/versions`
【F:backend/apps/documents/urls.py†L1-L9】

### AI (stub)
- `POST /api/ai/next-step/`
- `POST /api/ai/document-draft/`
- `POST /api/ai/document-feedback/`
- `POST /api/ai/commonapp-draft/`
【F:backend/apps/ai/urls.py†L1-L9】

### UI для проверки
- `GET /app/` — MVP‑консоль для демонстрации текущих API (Auth, Profile, Universities, My Universities, Applications) + заготовки для Tasks/Documents/AI.
- `GET /applications-ui/` — минимальная браузерная форма для теста Applications API. Страница ожидает JWT access token в поле ввода.
【F:backend/config/urls.py†L1-L9】

## Запланировано в MVP (ещё не реализовано)

Согласно `MVP_SPEC.md`, нужно добавить следующие эндпоинты (без интеграции с Common App, только черновики/проверки):

### UI страницы
- Onboarding → Dashboard → Applications → Tasks → Documents → Common App Draft
【F:MVP_SPEC.md†L271-L271】
