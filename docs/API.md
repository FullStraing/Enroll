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

### UI страницы
- `GET /` — публичный лендинг Enroll AI.
- `GET /register` — регистрация.
- `GET /login` — вход.
- `GET /dashboard/` — основная точка входа.
- `GET /onboarding/` — заполнение профиля.
- `GET /applications/` — управление списком университетов (applications flow финализируем позже).
- `GET /tasks/` — задачи и генерация чеклиста.
- `GET /documents/` — документы и версии.
- `GET /common-app/` — Common App Draft (AI stub).
- `GET /app/` — API консоль.
- `GET /applications-ui/` — минимальная форма для Applications API.
【F:backend/config/urls.py†L1-L18】

## Запланировано в MVP (ещё не реализовано)

- Финализация Applications workflow (последний этап).
