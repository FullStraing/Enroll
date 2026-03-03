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

## Next.js frontend (основной продуктовый UI)

Django работает в режиме API/admin: `http://127.0.0.1:8000/api/*`, `http://127.0.0.1:8000/admin/`.

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

- `http://127.0.0.1:3000/` — публичный лендинг Enroll AI (Next.js).
- `http://127.0.0.1:3000/login` — вход.
- `http://127.0.0.1:3000/register` — регистрация.
- `http://127.0.0.1:3000/dashboard` — dashboard.
- `http://127.0.0.1:3000/onboarding` — профиль.
- `http://127.0.0.1:3000/applications` — университеты и заявки.
- `http://127.0.0.1:3000/calendar` — календарь задач и дедлайнов.
- `http://127.0.0.1:3000/documents` — документы и версии.
- `http://127.0.0.1:3000/common-app` — Common App Draft (AI stub).
- `http://127.0.0.1:3000/settings` — настройки профиля/пароля.
- `http://127.0.0.1:8000/api/ping/` — проверка backend API.


## Automated University Ingestion (licensed-first)

Commands:

```bash
python backend/manage.py ingest_universities_full --limit 100
python backend/manage.py ingest_universities_delta --since-days 1
python backend/manage.py ingest_backfill --start-offset 0 --limit 100
python backend/manage.py ingest_quality_report
```

Scheduler fallback (APScheduler):

```bash
python backend/manage.py run_ingestion_scheduler
```

Safe cleanup (keeps node_modules):

```powershell
./scripts/clean_local.ps1
```

More details: `docs/INGESTION_AUTOMATION.md`.


## Niche-first automation queue

Run Redis + worker:

```bash
celery -A config worker -l info --concurrency=4
```

Enqueue scraping runs:

```bash
python backend/manage.py niche_enqueue_full_weekly --limit 1000
python backend/manage.py niche_enqueue_delta_daily --since-days 1
python backend/manage.py niche_enqueue_recovery_failed
```

Scheduler fallback:

```bash
python backend/manage.py run_niche_scheduler
```

## GradGPT scraping (primary)

Use GradGPT Common Data Set as primary source:

```bash
python backend/manage.py scrape_gradgpt_universities --dry-run --limit 5
python backend/manage.py scrape_gradgpt_universities --limit 50
```

Optional:

- `--only-url https://www.gradgpt.com/common-data-set/harvard-university`
- `--index-url https://www.gradgpt.com/common-data-set`
- `--timeout 30`

## Deadlines ingestion (official admissions)

```bash
python backend/manage.py ingest_university_deadlines --limit 100 --source petersons
python backend/manage.py deadline_quality_report
python backend/manage.py recompute_main_deadline_from_deadlines
```

## Peterson profile enrichment (extra blocks)

```bash
python backend/manage.py scrape_peterson_universities --limit 100
```
