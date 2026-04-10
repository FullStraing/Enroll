# Production Launch Guide

## Current live topology

- Frontend: Vercel project `frontend`
- Backend: Railway project `enroll`, service `backend-api`
- Database: Railway service `postgres-db`
- Cache: Railway service `redis-cache`
- File storage: Cloudflare R2 bucket `enroll-documents`

Current important reality:

- Git `main` can be ahead of production
- not every push has been deployed
- the latest explicitly confirmed frontend deploy in this workstream was based on commit `fa7cbf8`
- newer frontend commits in `main` such as `bd7fd76` and `3ca8273` are pushed but were not part of that confirmed deploy checkpoint
- always distinguish:
  - local only
  - pushed
  - deployed

## Environment strategy

Local:

- one real root `.env`
- frontend and backend both read from it in local development

Production:

- do not upload root `.env`
- put secrets in Vercel / Railway env panels only

Frontend env examples:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Backend env examples:

- `DJANGO_*`
- `POSTGRES_*`
- `REDIS_*`
- `SENTRY_*`
- `GOOGLE_OAUTH_CLIENT_ID`
- storage keys
- feature flags

## Frontend deploy

Deploy target:

- Vercel project root: `frontend/`

Checks before deploy:

- `npm run lint`
- `npm run build`
- visual QA on:
  - `/`
  - `/product`
  - `/pricing`
  - `/dashboard`
  - `/universities`
  - `/documents`

Current rule:

- do not assume that a push equals a good release
- deploy only after explicit visual verification when the change is UI-heavy
- record the deploy checkpoint commit when production is updated

## Backend deploy

Deploy target:

- Railway service `backend-api`

Checks before deploy:

- migrations safe
- `python manage.py check`
- feature flags sane
- `/api/ping/` healthy after deploy

Current runtime stack:

- Postgres attached
- Redis attached
- S3-compatible storage enabled in production

## Feature flags / kill switches

Current important backend toggles:

- `AI_ENABLED`
- `FILE_UPLOADS_ENABLED`
- `COMMUNITY_POSTING_ENABLED`
- `REGISTRATION_ENABLED`
- `GOOGLE_AUTH_ENABLED`
- `MAINTENANCE_MODE`

These should be used before rollback when a subsystem is failing.

## Monitoring

Current monitoring baseline:

- Sentry configured
- `send_default_pii=False`
- `/api/ping/` exposes runtime health

Still missing / should be verified manually:

- backup and restore drill
- explicit incident runbook per subsystem
- quota/abuse monitoring around free usage
- cleanup of any accidental public Railway service domains for non-web services

## File storage

Production expectation:

- no local disk uploads
- object storage only
- signed/private file URLs

Current storage:

- Cloudflare R2

## Security status

Already hardened:

- unique auth identity linkage
- better Google auth handling
- registration password validation
- throttling on sensitive endpoints
- shorter JWT lifetimes
- upload allowlist
- redacted AI logging
- active-only university exposure

Still open before a more public launch:

- real entitlement / billing enforcement
- stronger quotas on user-generated actions
- fuller HttpOnly-cookie auth architecture
- dashboard snapshot tooltip still needs no-layout-shift behavior after hover/tap

## Release checklist

Before frontend release:

- `npm run lint`
- `npm run build`
- visual pass on critical routes
- confirm whether this is only pushed or actually deployed
- record which commit is now live on Vercel

Before backend release:

- migrations checked
- feature flags reviewed
- `/api/ping/` checked after deploy

Before broader beta:

- free-account gating implemented
- limit states visible in UI
- Common App and essays workflow deeper polish
- remaining mojibake removed
- dashboard snapshot hover/click behavior no longer reflows the page
