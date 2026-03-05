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


## Niche scraper additions (2026-02-28)

- `GET /api/universities/<id>/source-snapshot/` -> latest snapshot payload for internal/admin usage.
- `GET /api/universities/<id>/metrics/` -> normalized key/value metrics for filtering and analytics.

Extended fields on `GET /api/universities/`:
- `last_scraped_at`
- `data_freshness_days`
- `net_price`
- `room_and_board`
- `housing_cost`


## Automated ingestion endpoints/fields (licensed pipeline)

University object now includes read-only metadata for ingestion:
- `source_provider`
- `external_id`
- `is_active`
- `last_ingested_at`
- `last_scraped_at`
- `data_freshness_days`

Internal endpoints (already protected):
- `GET /api/universities/<id>/source-snapshot/`
- `GET /api/universities/<id>/metrics/`

- University payload now includes ingestion fields: `source_provider`, `external_id`, `is_active`, `last_ingested_at`.

## Deadlines API (2026-03-03)

- `GET /api/universities/{id}/deadlines/`
  - returns typed deadlines (`EA`, `ED1`, `ED2`, `REA`, `RD`, `TRANSFER_*`, `PRIORITY`, `ROLLING`, `OTHER`)
  - includes `deadline_date`, `deadline_text`, `notification_date`, `notification_text`, `is_rolling`, `source_url`, `source_label`, `confidence`

## Peterson enrichment metrics (2026-03-03)

- Existing `GET /api/universities/{id}/metrics/` now may include additional keys:
  - `location_contact`, `majors_degrees`, `admission_requirements_matrix`,
  - `female_admissions`, `male_admissions`, `test_policy_details`,
  - `financial_aid_extended`, `campus_life`, `athletics`,
  - `majors_count`, `avg_gpa`.

## Essays API (Phase 1 + 3 + 4 baseline, 2026-03-04)

- `GET /api/essays/` - list current user's essays (manager view).
- `POST /api/essays/` - create essay and auto-create `v1 Initial draft`.
- `GET /api/essays/{id}/` - essay detail.
- `PUT /api/essays/{id}/` - update essay metadata.
- `DELETE /api/essays/{id}/` - delete essay with all versions.
- `GET /api/essays/{id}/versions/` - list versions for essay.
- `POST /api/essays/{id}/versions/` - create next version (`vN+1`).
- `GET /api/essay-versions/{id}/` - version detail.
- `PUT /api/essay-versions/{id}/` - update content/label for one version.

Validation rules:
- `supplemental_essay` requires `university` and non-empty `prompt_title`.

## Essays versions status (Phase 6 update, 2026-03-05)

- `EssayVersion` now includes:
  - `status`: `draft | revised | ai_improved | final`
  - `is_latest`: read-only helper flag
- Update rule:
  - only latest version can be edited via `PUT /api/essay-versions/{id}/`
  - older versions are read-only snapshots
- Final status rule:
  - when one version becomes `final`, previous `final` versions in same essay are auto-demoted to `revised`.

## Essays onboarding preference (2026-03-05)

- `GET /api/auth/profile/` now includes:
  - `essays_onboarding_seen: boolean`
- `PATCH /api/auth/profile/` accepts:
  - `{ "essays_onboarding_seen": true }`
  - used to skip/show first-time Essays onboarding modal.
