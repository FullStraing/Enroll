# Project Handoff

Last updated: 2026-04-10

## 1. Current situation in one screen

Enroll is already a real working product, not a skeleton.

Working modules:

- marketing site
- auth + intro quiz
- dashboard
- universities
- tasks/calendar
- documents
- essays baseline
- Common App baseline
- community baseline
- settings

Infra already live:

- Vercel frontend
- Railway backend + Postgres + Redis
- Cloudflare R2 for documents

## 2. Important operational truth

Do not confuse these states:

- local changes
- pushed changes
- deployed changes

At the moment:

- multiple frontend batches were pushed after the last explicitly confirmed production deploy
- production can lag behind `main`

Current known checkpoint:

- last explicitly confirmed frontend deploy in this workstream: `fa7cbf8`
- newer commits pushed to `main` after that include:
  - `bd7fd76` - `Polish dashboard and marketing dark mode`
  - `3ca8273` - `Fix marketing pricing and product dark contrast`

This docs refresh is still local until explicitly committed.

## 3. What was recently done

Major recent work:

- marketing redesign of `/`, `/product`, `/pricing`
- global dark mode
- global RU / EN localization foundation
- dashboard snapshot / share redesign
- security hardening before beta

Recent pushed frontend work already in `main`:

- dark-mode rollout and cleanup
- dashboard/tasks/universities/community localization and dark-theme fixes
- pricing/product/landing dark-mode contrast fixes

## 4. What is actually still broken / incomplete

### Product/business gap

The biggest real missing piece now is:

- no proper account plan / entitlement system

That means:

- free vs paid is not enforced by backend
- free users are not yet capped to 2 universities
- "limited access" exists only as intention, not as a safe system

### Product depth gaps

- Common App is still not fully finished
- essays advanced loop is still not fully finished
- some deeper product screens are still not fully localized

### Known UI issue

- dashboard snapshot donut tooltip still shifts layout when shown inside the card and should be moved to a non-layout-affecting overlay

### Content/data debt

- legacy mojibake still exists in older copy sources
- especially old RU strings in:
  - `frontend/app/landing-content.ts`
  - `frontend/lib/i18n.ts`

### Release discipline gap

- too many frontend/UI changes have historically been bundled together
- visual QA often catches issues that lint/build cannot
- the next chat should keep being strict about "pushed" vs "deployed"

## 5. Recommended next priority

### Highest priority now

Implement a real account-plan model.

Minimum version:

1. Add a backend source of truth for user plan:
   - `free`
   - `pro`
   - optional `pilot` / `premium`
2. Enforce free-tier university cap on backend:
   - free user can create only 2 `StudentUniversity` items
3. Reflect that in frontend:
   - disable add button when limit reached
   - show clear upgrade/limit state
4. Keep enforcement server-side first:
   - frontend should only mirror the rule, not own it

## 6. Concrete implementation path for free-account limit

Recommended architecture:

### Backend

Best place:

- extend the user/account model with plan info
- enforce in `StudentUniversityListCreateView`

Current relevant backend files:

- `backend/apps/users/models.py`
- `backend/apps/universities/models.py`
- `backend/apps/universities/views.py`
- `backend/apps/universities/serializers.py`

Recommended rule:

- if user plan is `free` and `StudentUniversity.objects.filter(student=user).count() >= 2`
- reject create with `400` or `403`
- return explicit machine-readable error code like:
  - `plan_limit_reached`
  - `free_university_limit_reached`

### Frontend

Relevant current frontend files:

- `frontend/app/universities/use-universities-page.ts`
- `frontend/components/universities/discover-grid.tsx`
- `frontend/components/universities/my-universities-table.tsx`
- `frontend/app/dashboard/page.tsx`

Recommended UX:

- show current usage: `2 / 2 universities`
- disable or intercept add actions
- show clean upgrade message, not a generic error toast

## 7. Theme/localization state

Already implemented:

- shared theme switcher
- shared language switcher
- light/dark mode across much of the product
- RU/EN across shell, marketing, dashboard, intro quiz, documents, universities, settings, community

Still incomplete:

- full text cleanup everywhere
- some deep screens still need a final bilingual pass
- some old files still need UTF-8 cleanup

## 8. Security state

Already improved:

- auth identity hardening
- Google auth no longer blindly matches first email
- throttling on sensitive endpoints
- upload allowlist
- shorter JWT lifetime
- Sentry PII reduction
- AI log redaction

Still open:

- full plan/entitlement system
- stronger user quotas
- more complete cookie/session hardening

## 9. Infra state

Verified live topology:

- Vercel project: `frontend`
- Railway project: `enroll`
- Railway services:
  - `backend-api`
  - `postgres-db`
  - `redis-cache`
- Cloudflare R2 bucket:
  - `enroll-documents`

Do not remove:

- `bilimtube` resources, because the user explicitly said they are still needed for another background project

Infra notes that still matter:

- custom domain is not attached yet
- backend is healthy
- frontend production should be treated as behind `main` until a new deploy is explicitly confirmed

## 10. Serena / tooling note

`AGENTS.md` says to connect Serena MCP before coding.

Current reality in this session:

- Serena MCP failed to initialize repeatedly
- latest error looked like:
  - `MCP startup failed: handshaking with MCP server failed: connection closed: initialize response`

So the next chat should not assume Serena is working unless it is explicitly re-tested successfully.

## 11. Files that matter most right now

If the next chat needs the fastest accurate context, start with:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/TASKS.md`
- `docs/PRODUCTION_LAUNCH.md`
- `docs/DEV_LOG.md`
- `docs/PROJECT_HANDOFF.md`
- `frontend/components/dashboard/admissions-score-donut.tsx`
- `frontend/components/landing/pricing-table.tsx`
- `frontend/app/landing-content.ts`
- `frontend/lib/i18n.ts`
- `backend/apps/universities/views.py`
- `backend/apps/users/models.py`

## 12. Recommended first action in the next chat

Start here:

1. add a real plan/entitlement model
2. enforce the free user limit of 2 universities on backend
3. reflect that cleanly in frontend
4. then continue the UTF-8 cleanup and remaining localization pass
