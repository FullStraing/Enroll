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

## Запланировано в MVP (ещё не реализовано)

Согласно `MVP_SPEC.md`, нужно добавить следующие эндпоинты (без интеграции с Common App, только черновики/проверки):

### Applications + Tasks
- `GET /applications`
- `POST /applications` (manual add or from university_id)
- `PUT /applications/:id` (deadline/status)
- `GET /tasks?status=&application_id=`
- `POST /tasks`
- `POST /tasks/generate`
- `PUT /tasks/:id`
【F:MVP_SPEC.md†L228-L245】

### Documents + Versions
- `GET /documents`
- `POST /documents`
- `GET /documents/:id`
- `POST /documents/:id/versions`
- `GET /documents/:id/versions`
【F:MVP_SPEC.md†L246-L256】

### AI (черновики/feedback)
- `POST /ai/next-step`
- `POST /ai/document-draft`
- `POST /ai/document-feedback`
- `POST /ai/commonapp-draft`
【F:MVP_SPEC.md†L258-L266】
