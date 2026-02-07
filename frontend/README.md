# Enroll Next.js Frontend

Frontend is now fully implemented in Next.js and talks to the existing Django API.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Default API target:

- `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`

## Current routes

Public:

- `/` landing
- `/login`
- `/register`

Protected:

- `/dashboard`
- `/onboarding`
- `/applications`
- `/calendar`
- `/tasks`
- `/documents`
- `/common-app`
- `/settings`

## Notes

- Auth uses the same JWT flow as backend (`/api/auth/token/`) with `enroll_token` cookie and localStorage.
- Middleware protects workspace routes and redirects unauthenticated users to `/login`.
- Main planning flow is on `/calendar`; `/tasks` is kept as a compatibility redirect to `/calendar`.
- Backend now runs as API/admin only (`/api/*`, `/admin/*`), and product UI is fully handled by Next.js.
