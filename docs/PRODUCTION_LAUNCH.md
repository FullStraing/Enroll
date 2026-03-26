# Production Launch Guide

## Target topology

- Frontend: Vercel
- Backend: Railway or Render
- Database: managed PostgreSQL
- Cache / queue: managed Redis
- File uploads: S3-compatible storage (Cloudflare R2 or AWS S3)
- Billing later: Paddle

## Local `.env` vs production env panels

Local development:

- keep one real `.env` in the repo root
- backend already reads it through `backend/config/settings.py`
- frontend local commands already read it through `frontend/scripts/run-next.mjs`

Production:

- do **not** upload the root `.env` file to Vercel / Railway / Render
- instead, copy the same values into each platform's environment variable UI
- keep `.env.example` as the source-of-truth template for required keys

Recommended split:

- Vercel gets frontend-safe values such as:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Railway/Render gets backend/runtime secrets such as:
  - `DJANGO_*`
  - `POSTGRES_*`
  - `REDIS_*`
  - `CELERY_*`
  - AI keys
  - storage keys
  - Sentry DSN
  - future Paddle keys

## 1. Public domains

Recommended:

- `app.yourdomain.com` -> frontend
- `api.yourdomain.com` -> backend

These same public URLs should be used in:

- `NEXT_PUBLIC_API_BASE_URL`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- Paddle verification later

## 2. Frontend deploy (Vercel)

Deploy `frontend/` as the Vercel project root.

Exact order:

1. Create a new Vercel project.
2. Set the root directory to `frontend/`.
3. Add frontend env vars from the root `.env`.
4. Deploy once to a preview URL before attaching the real domain.

Required env:

- `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...` if Google sign-in is enabled

Checks:

- build succeeds
- protected routes redirect correctly when no `enroll_token` cookie is present
- auth works over HTTPS
- app can reach `NEXT_PUBLIC_API_BASE_URL` without localhost fallbacks

## 3. Backend deploy (Railway / Render)

Deploy from repo root using the included `Procfile`, or set the start command manually:

```bash
gunicorn config.wsgi:application --chdir backend --bind 0.0.0.0:$PORT
```

For monorepo-safe Railway deploys, this repo also includes a root `Dockerfile` and `.dockerignore` so Railway can build the Django backend deterministically without trying to infer both frontend and backend stacks from the same root.

Optional worker:

```bash
celery -A config worker --workdir backend -l info
```

Exact order:

1. Create the backend service from this repo.
2. Attach managed PostgreSQL.
3. Attach managed Redis.
4. Copy backend/runtime env vars from the root `.env` into the service env panel.
5. Deploy the web service first.
6. Run migrations and `collectstatic`.
7. Verify `/api/ping/`.
8. Only then point Vercel at the backend URL.

Required env:

- `DJANGO_ENV=production`
- `DJANGO_DEBUG=0`
- `DJANGO_SECRET_KEY=...`
- `DJANGO_ALLOWED_HOSTS=api.yourdomain.com`
- `CORS_ALLOWED_ORIGINS=https://app.yourdomain.com`
- `CSRF_TRUSTED_ORIGINS=https://app.yourdomain.com`
- `POSTGRES_*`
- `REDIS_CACHE_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `AI_ENABLED=1`
- `FILE_UPLOADS_ENABLED=1`
- `COMMUNITY_POSTING_ENABLED=1`
- `REGISTRATION_ENABLED=1`
- `GOOGLE_AUTH_ENABLED=1`
- `MAINTENANCE_MODE=0`

Run after deploy:

```bash
python backend/manage.py migrate
python backend/manage.py collectstatic --noinput
python backend/manage.py createsuperuser
```

## 4. File storage

Do not launch documents on local disk.

Enable:

- `USE_S3_STORAGE=1`
- `AWS_STORAGE_BUCKET_NAME`
- `AWS_S3_ACCESS_KEY_ID`
- `AWS_S3_SECRET_ACCESS_KEY`
- `AWS_S3_ENDPOINT_URL`
- `AWS_S3_REGION_NAME`
- optional `AWS_S3_CUSTOM_DOMAIN`

Cloudflare R2 example:

- `AWS_STORAGE_BUCKET_NAME=enroll-documents`
- `AWS_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com`
- `AWS_S3_REGION_NAME=auto`
- keep `AWS_QUERYSTRING_AUTH=1` so document links stay signed/private by default

Safety guard:

- in `production`, document uploads stay disabled unless `USE_S3_STORAGE=1` is set with valid object-storage credentials
- `FILE_UPLOADS_ENABLED=1` on its own is intentionally not enough to re-enable public uploads by mistake

Recommended for private file URLs:

- `AWS_QUERYSTRING_AUTH=1`

## 5. Monitoring

Recommended env:

- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT=production`
- `SENTRY_TRACES_SAMPLE_RATE=0.05`

Health check:

- `GET /api/ping/`

The response now includes:

- environment
- database status
- cache backend/status
- storage backend
- runtime feature flags

## 6. Emergency switches and first-response runbook

Operator kill switches:

- `AI_ENABLED=0` -> disable all Essay Coach / AI endpoints cleanly
- `FILE_UPLOADS_ENABLED=0` -> stop new document uploads without breaking reads
- `COMMUNITY_POSTING_ENABLED=0` -> make community read-only
- `REGISTRATION_ENABLED=0` -> stop new account creation
- `GOOGLE_AUTH_ENABLED=0` -> disable Google auth independently
- `MAINTENANCE_MODE=1` -> show a maintenance banner in the app shell

First-response order during a production incident:

1. Turn on `MAINTENANCE_MODE=1` if users need a visible warning.
2. Turn off the feature causing impact:
   - AI failure -> `AI_ENABLED=0`
   - storage/upload failure -> `FILE_UPLOADS_ENABLED=0`
   - community abuse burst -> `COMMUNITY_POSTING_ENABLED=0`
   - auth/signup abuse -> `REGISTRATION_ENABLED=0` and optionally `GOOGLE_AUTH_ENABLED=0`
3. Verify `/api/ping/` reflects the new switch state.
4. Check platform logs / Sentry.
5. Roll back frontend or backend only if the switch does not stabilize the issue.

## 7. File storage and secrets

Files:

- do not launch user uploads on local host disk
- enable S3-compatible storage before inviting public users
- prefer signed/private file URLs for documents
- verify bucket backup / retention policy outside the app

Secrets:

- keep the repo root `.env` local-only
- put production values only in Vercel / Railway / Render env systems
- rotate `DJANGO_SECRET_KEY` before first production deploy
- never paste live AI, DB, storage, OAuth, or Paddle keys into committed files

## 8. Public pages required before billing

Make sure these are public and linked:

- `/pricing`
- `/terms`
- `/privacy-policy`
- `/refund-policy`

## 9. Paddle later

Before enabling billing:

- finish Paddle KYB/KYC
- verify public domain
- create product + prices in sandbox
- store:
  - `PADDLE_API_KEY`
  - `PADDLE_CLIENT_TOKEN`
  - `PADDLE_WEBHOOK_SECRET`
  - `PADDLE_PRICE_ID_*`

Soft launch does not depend on billing being live.

## 10. Launch checklist

- frontend build passes
- `python manage.py check` passes
- `python manage.py check --deploy` passes with production-like env
- root `.env` stays local only; production uses platform env panels
- uploads are stored in object storage
- `/api/ping/` is healthy in production
- dashboard, edit profile, tasks, essays, documents, and community are tested manually
- legal pages are public
- admin access is confirmed
- managed Postgres backups are confirmed
- rollback path is documented:
  - frontend -> previous Vercel deploy
  - backend -> previous platform release + DB-safe rollback rules
