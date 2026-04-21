# Enroll

Enroll is an admissions operating system for students applying abroad.

The product is not about auto-submission. It is about keeping the full application cycle inside one structured workspace:

- shortlist and university research
- deadlines and planning
- tasks and today-first execution
- essays and versions
- document vault
- Common App-style profile completion
- one visible next step instead of scattered tools

## Current stack

- Backend: Django + Django REST Framework + PostgreSQL
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Auth: JWT access token in frontend storage + lightweight `enroll_session` marker cookie for workspace bootstrap
- Cache / queue: Redis
- File storage: S3-compatible object storage in production
- Theme / UI: shared Enroll token system, light + dark mode
- Localization: shared RU / EN switcher with cookie-backed locale

## Current product state

Implemented:

- marketing site: `/`, `/product`, `/pricing`, `/pilot`
- intro quiz before auth
- login / register / Google sign-in
- shared app shell with locale switcher and theme switcher
- dashboard with snapshot/export/share flow
- universities list and university detail
- tasks / calendar planning flow
- documents vault
- essays manager + versions + autosave baseline
- Common App workflow baseline
- community chat baseline
- settings
- legal pages

Recently added:

- global RU / EN localization foundation across marketing, auth, shell, dashboard, intro quiz, documents, universities, settings, and community
- global light / dark theme
- marketing refresh for home / product / pricing
- stronger beta security hardening
- dashboard snapshot and share flow redesign
- real backend account-plan / entitlement model
- server-side free-plan preview limits across universities, essays, essay versions, and AI requests
- intro-quiz answers now hydrate onboarding / edit-profile from backend profile data after signup

Still in progress:

- full Common App parity across all sections
- deeper essays workflow
- complete bilingual coverage across every deep product surface
- production billing / payment provider integration
- final UTF-8 copy cleanup where older mojibake still survives in some legacy dictionaries
- dashboard snapshot donut hover tooltip still needs a no-layout-shift presentation

## Local run

### Backend

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver
```

Backend:

- API/Admin: `http://127.0.0.1:8000`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

- App: `http://localhost:3000`

## Environment

Local development uses one root `.env`.

Important:

- root `.env` is local-only
- production secrets must live in Vercel / Railway env panels
- `.env.example` is the template for required values

Important frontend env:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Important backend env:

- `DJANGO_*`
- `POSTGRES_*`
- `REDIS_*`
- `GOOGLE_OAUTH_CLIENT_ID`
- `SENTRY_*`
- `AWS_*` / S3-compatible storage keys
- feature flags such as:
  - `AI_ENABLED`
  - `FILE_UPLOADS_ENABLED`
  - `COMMUNITY_POSTING_ENABLED`
  - `REGISTRATION_ENABLED`
  - `GOOGLE_AUTH_ENABLED`
  - `MAINTENANCE_MODE`

## Main frontend routes

Public:

- `/`
- `/product`
- `/pricing`
- `/pilot`
- `/intro-quiz`
- `/login`
- `/register`
- `/terms`
- `/privacy-policy`
- `/refund-policy`

Protected workspace:

- `/dashboard`
- `/onboarding`
- `/applications`
- `/universities`
- `/universities/[id]`
- `/calendar`
- `/tasks` -> redirects to `/calendar`
- `/activities`
- `/documents`
- `/essays`
- `/essays/[id]`
- `/common-app`
- `/community`
- `/settings`

## Main backend API domains

- `/api/ping/`
- `/api/me/`
- `/api/auth/*`
- `/api/universities/*`
- `/api/my-universities/*`
- `/api/applications/*`
- `/api/tasks/*`
- `/api/documents/*`
- `/api/essays/*`
- `/api/ai/*`
- `/api/community/*`
- `/api/auth/common-app-progress/`

## Production topology

Current live topology:

- Frontend: Vercel project `frontend`
- Backend: Railway project `enroll`, service `backend-api`
- Database: Railway `postgres-db`
- Cache: Railway `redis-cache`
- File storage: Cloudflare R2 bucket `enroll-documents`

Current important reality:

- `main` can be ahead of production
- in the latest known state, frontend production is behind the newest pushed `main`
- the last explicitly confirmed frontend deploy in this workstream was based on commit `fa7cbf8`
- later frontend commits such as `bd7fd76` and `3ca8273` are pushed but not part of that confirmed deploy
- always distinguish:
  - local changes
  - pushed changes
  - deployed changes

## Documentation map

- `docs/ARCHITECTURE.md` - current architecture and system boundaries
- `docs/TASKS.md` - actual implementation state and next priorities
- `docs/DEV_ROADMAP.md` - execution sequence by phase
- `docs/PRODUCTION_LAUNCH.md` - live infra topology and launch checklist
- `docs/API.md` - backend API surface
- `docs/DEV_LOG.md` - chronological work log
- `docs/PROJECT_HANDOFF.md` - current situation summary for the next chat
- `docs/UI_SYSTEM_RULES.md` - source of truth for frontend UI decisions

## Current recommended focus

The correct order now is:

1. production billing / payment provider integration on top of the existing plan / entitlement layer
2. continue tightening free-vs-paid UX around the already-enforced preview limits
3. finish Common App parity
4. finish essays advanced loop
5. clean remaining legacy mojibake and complete deep-screen localization
