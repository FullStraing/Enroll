# Enroll Next.js Frontend

This frontend is the main user-facing application for Enroll. Django serves the API and admin, while Next.js owns the product UI.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Default API target:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_client_id
```

## Current route map

Public:
- `/`
- `/intro-quiz`
- `/login`
- `/register`
- `/privacy-policy`
- `/pilot`
- `/ui-lab`

Protected:
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

## Current frontend responsibilities

- public landing and acquisition flow
- intro quiz before auth
- session-gated workspace shell
- Common App UI and progress rendering
- universities and university detail UI
- calendar/tasks UI
- documents UI
- essays manager and essay workspace UI
- settings and legal surfaces

## Notes

- Auth uses the backend JWT flow (`/api/auth/token/`).
- Google Sign-In uses `/api/auth/google/` and requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Protected routes are handled in the frontend app layer.
- The landing CTA can route users either into `/intro-quiz` or directly into `/dashboard` depending on known state.
- Common App relies on backend-driven schema/progress rather than a static hardcoded form.
- Reusable UI components should follow `docs/UI_SYSTEM_RULES.md`.
- `npm run dev` now clears `frontend/.next` cache on start to prevent stale chunk/css 404 issues in dev mode.
