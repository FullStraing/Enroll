# Enroll

Enroll is an admissions operating system for students applying to U.S. universities.

The product focus is not auto-submission. It is structured preparation:
- shortlist and university research
- deadlines and planning
- documents and essays
- Common App-style profile completion
- clear next actions inside one workspace

## Current stack

- Backend: Django + Django REST Framework + PostgreSQL
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Auth: JWT with frontend cookie/session handling
- Rich text editor: Tiptap

## Current product state

Implemented now:
- public landing page
- intro quiz before auth
- login / register / settings / password change
- dashboard shell
- universities list, university detail, applications flow
- calendar page and task generation baseline
- documents page
- essays manager + essay workspace + versions + autosave baseline
- Common App draft flow with backend-driven progress
- privacy policy page

Still in progress:
- full Common App parity across all sections
- stronger dashboard readiness and next-step logic
- essay AI mentor, score, and deeper compare UX
- production hardening, observability, and deployment polish

## Local run

### 1. Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
copy backend\.env.example backend\.env
python backend/manage.py migrate
python backend/manage.py runserver
```

Backend is available at:
- API/Admin: `http://127.0.0.1:8000`

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend is available at:
- App: `http://localhost:3000`

## Environment

### Backend

Base local variables are documented in `backend/.env.example`.

Important ones:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `GRADGPT_INDEX_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`

### Frontend

`frontend/.env.local`

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Main frontend routes

Public:
- `/`
- `/intro-quiz`
- `/login`
- `/register`
- `/privacy-policy`
- `/pilot`
- `/ui-lab`

Protected workspace:
- `/dashboard`
- `/onboarding`
- `/applications`
- `/universities/[id]`
- `/calendar`
- `/tasks` -> redirects to `/calendar`
- `/documents`
- `/essays`
- `/essays/[id]`
- `/common-app`
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
- `/api/auth/common-app-progress/`

See:
- `docs/API.md`
- `docs/ARCHITECTURE.md`
- `docs/TASKS.md`
- `docs/DEV_ROADMAP.md`
- `docs/DEVELOPMENT_HISTORY.md`

## Documentation map

- `docs/TASKS.md` - actual implementation status and next priorities
- `docs/DEV_ROADMAP.md` - product roadmap by phase
- `docs/ARCHITECTURE.md` - backend/frontend/data architecture
- `docs/API.md` - current API surface used by the frontend
- `docs/DEVELOPMENT_HISTORY.md` - how the project evolved to the current state
- `docs/UI_SYSTEM_RULES.md` - source of truth for UI and interaction decisions
- `docs/sales/*` - go-to-market and pilot sales materials

## Current recommended focus

The correct sequence is:
1. finish Common App parity
2. turn Dashboard into a real command center
3. complete the Essays loop
4. harden for production
