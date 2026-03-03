# Архитектура (MVP)

## Обзор

Backend построен на Django + DRF. Конфигурация в `config`, приложения расположены в `apps/` и подключены в `INSTALLED_APPS`: `core`, `users`, `universities`, `tasks`, `documents`, `ai`.【F:backend/config/settings.py†L31-L46】

Корневой роутинг включает `/admin/` и `/api/`, а дальше маршруты распределяются по приложениям.【F:backend/config/urls.py†L1-L7】

База данных по умолчанию — PostgreSQL (можно временно включить SQLite через `USE_SQLITE=1`).【F:backend/config/settings.py†L44-L73】

UI страницы находятся в `templates/ui/` и подключены через `config.urls`; публичный лендинг — `templates/landing.html`, auth‑страницы — `templates/auth/`.【F:backend/config/urls.py†L1-L18】
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

### `apps.tasks`

- `RoadmapStage` описывает этапы MVP‑роадмапа, `Task` — задачи пользователя, привязанные к этапу/заявке.【F:backend/apps/tasks/models.py†L1-L71】
- Эндпоинты: список/создание задач, генерация задач из шаблонов, список этапов роадмапа.【F:backend/apps/tasks/urls.py†L1-L7】

### `apps.documents`

- `Document` хранит документ пользователя, `DocumentVersion` — версии с контентом и автором (user/ai).【F:backend/apps/documents/models.py†L1-L72】
- Эндпоинты: документы и версии документов.【F:backend/apps/documents/urls.py†L1-L9】

### `apps.ai`

- `AIInteraction` логирует запрос/ответ AI для MVP‑стабов.【F:backend/apps/ai/models.py†L1-L28】
- Эндпоинты: `/api/ai/*` (stub‑ответы).【F:backend/apps/ai/urls.py†L1-L9】

## Аутентификация и доступ

По умолчанию используется JWT-аутентификация, а доступ ограничен `IsAuthenticated` на уровне DRF, кроме регистрационных эндпоинтов.【F:backend/config/settings.py†L113-L119】【F:backend/apps/users/views.py†L7-L10】

## Текущий статус MVP

На данный момент реализованы: регистрация, профиль студента, справочник университетов, Applications API, Tasks, Documents, AI stub‑эндпоинты, MVP‑консоль `/app/` и минимальная браузерная форма `/applications-ui/`. Дальнейшие шаги — UI страницы по флоу (Onboarding → Dashboard → Applications → Tasks → Documents → Common App Draft).【F:backend/apps/users/urls.py†L1-L7】【F:backend/apps/universities/urls.py†L1-L14】【F:backend/apps/tasks/urls.py†L1-L7】【F:backend/apps/documents/urls.py†L1-L9】【F:backend/apps/ai/urls.py†L1-L9】【F:backend/config/urls.py†L1-L9】


## Niche full-data scraping pipeline

The universities module now includes a multi-layer scraping storage model:

- `UniversitySourceSnapshot`: full aggregated raw payload by scrape run.
- `UniversitySourceSection`: per-page/per-section parsed blocks and status.
- `UniversityMetric`: normalized metrics used by product UI and filters.
- `UniversityMediaRef`: media metadata references (URL only, no binary copy).
- `ScrapeRun` and `ScrapeRunItem`: operational logs for each scraping execution.

Management commands:
- `niche_session_bootstrap`
- `scrape_niche_universities`
- `reparse_snapshots`


## Licensed ingestion pipeline

Primary ingestion is `LicensedFeedConnector` (mock/api modes), with Niche scraping reserved for fallback/enrichment.

Pipeline stages:
1. connector fetch (full or delta)
2. normalize + quality gate
3. snapshot + metrics/media persistence
4. read-model projection to `University`
5. run logging in `ScrapeRun`/`ScrapeRunItem`

Automation commands:
- `ingest_universities_full`
- `ingest_universities_delta`
- `ingest_backfill`
- `ingest_quality_report`
- `run_ingestion_scheduler` (APScheduler fallback)

- Added Niche automation runtime: Celery workers + persistent Playwright profiles + proxy pool rotation for anti-bot resilience.
