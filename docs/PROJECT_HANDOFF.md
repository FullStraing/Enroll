# Project Handoff

Last updated: 2026-04-21

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
- real backend account-plan / entitlement model
- free-plan preview limits enforced on backend and surfaced in universities/dashboard
- intro-quiz answers now hydrate onboarding / edit-profile from backend profile data after signup

Recent pushed frontend work already in `main`:

- dark-mode rollout and cleanup
- dashboard/tasks/universities/community localization and dark-theme fixes
- pricing/product/landing dark-mode contrast fixes

## 4. What is actually still broken / incomplete

### Product/business gap

The biggest real missing piece now is:

- production billing / payment provider integration

Current reality:

- backend account-plan / entitlement system already exists
- free vs paid limits are enforced on backend
- free tier is already a preview plan, not unlimited access

Current free preview defaults:

- `my universities`: max `2`
- `discover universities`: first `6` visible cards only
- `essays`: max `1`
- `essay versions`: max `5` per essay
- `AI requests`: max `10` per month

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

Add production billing / payment provider integration on top of the existing plan system.

Minimum version:

1. Keep the current backend source of truth for plan / entitlement / usage
2. Integrate a real payment provider without moving business access rules into frontend
3. Keep free preview enforcement server-side
4. Reflect billing state cleanly in frontend pricing / upgrade surfaces

## 6. Concrete implementation path for billing on top of plans

Recommended architecture:

### Backend

Current relevant backend files:

- `backend/apps/accounts/models.py`
- `backend/apps/accounts/services.py`
- `backend/apps/universities/views.py`
- `backend/apps/essays/views.py`
- `backend/apps/ai/views.py`
- `backend/apps/users/serializers.py`

Current rule layer already exists:

- plans live in `apps.accounts`
- usage is enforced server-side before create/action success
- `/api/auth/profile/` already exposes plan + usage summary

Next billing layer should:

- map payment state to existing plan assignments
- keep access control in backend entitlements
- avoid moving paid/free decisions into frontend

### Frontend

Relevant current frontend files:

- `frontend/app/universities/use-universities-page.ts`
- `frontend/components/universities/discover-grid.tsx`
- `frontend/components/universities/my-universities-table.tsx`
- `frontend/app/dashboard/page.tsx`

Current UX already exists:

- usage summary in universities and dashboard
- clean preview/limit states for free users
- shared plan badge in the workspace shell

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

- production billing integration
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

1. verify current plan / entitlement docs and pricing copy stay aligned with real enforced limits
2. implement production billing on top of the existing account-plan layer
3. continue the UTF-8 cleanup and remaining localization pass
4. keep deploy discipline strict about local vs pushed vs deployed
