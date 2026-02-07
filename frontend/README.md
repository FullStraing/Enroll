# Enroll Next.js Frontend

Separate frontend layer for incremental migration from Django templates.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Default API target:

- `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`

## Notes

- Existing Django pages remain available at `http://127.0.0.1:8000`.
- Protected routes in Next.js use the same JWT token cookie (`enroll_token`).
- Current migration scope: landing/login/register/dashboard implemented, other workspace routes scaffolded and linked back to Django pages.
