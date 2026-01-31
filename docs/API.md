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
<<<<<<< HEAD
- `POST /api/applications/` — создать заявку (ручное имя или university_id).
=======
- `POST /api/applications/` — создать заявку (только university_id из “My Universities”).
>>>>>>> 44eec72 (Update applications flow and focs)
- `GET /api/applications/<id>/` — детали заявки.
- `PUT /api/applications/<id>/` — обновить статус/дедлайн.
【F:backend/apps/universities/urls.py†L1-L14】

<<<<<<< HEAD
### Минимальный UI для проверки
- `GET /applications-ui/` — браузерная форма для теста Applications API. Страница ожидает JWT access token в поле ввода.
【F:backend/config/urls.py†L1-L8】
=======
### UI для проверки
- `GET /app/` — MVP‑консоль для демонстрации текущих API (Auth, Profile, Universities, My Universities, Applications) + заготовки для Tasks/Documents/AI.
- `GET /applications-ui/` — минимальная браузерная форма для теста Applications API. Страница ожидает JWT access token в поле ввода.
【F:backend/config/urls.py†L1-L9】
>>>>>>> 44eec72 (Update applications flow and focs)

## Запланировано в MVP (ещё не реализовано)

Согласно `MVP_SPEC.md`, нужно добавить следующие эндпоинты (без интеграции с Common App, только черновики/проверки):

### Tasks
- `GET /tasks?status=&application_id=`
- `POST /tasks`
- `POST /tasks/generate`
- `PUT /tasks/:id`
【F:MVP_SPEC.md†L236-L245】

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
