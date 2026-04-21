# Architecture

## Overview

Enroll uses a split product architecture:

- Backend: Django + DRF for auth, persistence, permissions, product rules, ingestion, and admin
- Frontend: Next.js App Router for the full user-facing product
- Database: PostgreSQL as the source of truth
- Cache / queue: Redis for cache and async jobs
- Storage: S3-compatible object storage in production

Django owns data and business rules.  
Next.js owns the application experience.

## High-level flow

1. User lands on `/`
2. CTA routes to `/intro-quiz` or `/dashboard` depending on auth/session state
3. User signs in or registers
4. Frontend opens protected workspace routes
5. Frontend reads and writes state through Django API endpoints

## Backend structure

Location: `backend/apps/`

Main apps:

- `core` - health, token endpoints, aggregate API utilities
- `analytics` - beta event intake and staff reporting
- `users` - auth, profile, onboarding, Common App progress, identity linkage
- `universities` - catalog, metrics, deadlines, snapshots, shortlist state
- `tasks` - tasks and roadmap-stage generation
- `documents` - document vault and upload flow
- `essays` - essays, versions, compare data
- `ai` - essay/assistant endpoints
- `community` - groups, posts, comments, reports

## Frontend structure

Location: `frontend/app/`

Main route layers:

- marketing: `/`, `/product`, `/pricing`, `/pilot`
- auth / activation: `/intro-quiz`, `/login`, `/register`
- workspace: dashboard, universities, documents, essays, tasks/calendar, community, settings, common-app

Shared UI entry points:

- `frontend/components/app-shell.tsx`
- `frontend/components/protected-page.tsx`
- `frontend/components/ui/*`
- `frontend/components/landing/*`
- `frontend/components/dashboard/*`

## Auth model

### Backend

- DRF SimpleJWT
- protected endpoints use standard auth permissions
- user identity hardening exists via `UserAuthIdentity`
- Google auth is linked through verified identity mapping, not raw email matching

### Frontend

- access token is stored client-side
- raw token is no longer mirrored into a readable cookie
- frontend writes only a lightweight `enroll_session` marker cookie for bootstrap/routing hints
- protected pages are guarded in the app shell / middleware layer

Important debt still open:

- auth is safer than before, but not yet a full HttpOnly-cookie architecture
- password signup is direct again; the temporary email-code verification flow was removed after rollback

## Localization architecture

Current localization is frontend-driven:

- locale cookie: `enroll_locale`
- shared locale provider in root layout
- shared RU / EN switcher in marketing header and app shell
- feature dictionaries currently include:
  - `frontend/lib/i18n.ts`
  - `frontend/lib/dashboard-copy.ts`
  - `frontend/lib/product-copy.ts`
  - `frontend/app/landing-content.ts`

Important:

- localization is not yet literally 100% complete across every deep screen
- some legacy mojibake still remains in older dictionaries and needs cleanup

## Theme architecture

Dark mode is implemented globally through:

- `next-themes`
- shared CSS tokens in `frontend/app/globals.css`
- shared `ThemeSwitcher`

Current theme model:

- `light`
- `dark`

`system` mode was intentionally removed during later polish to simplify UX.

## Common App architecture

The Common App system is backend-driven.

Typed fields live on:

- `StudentProfile`

Flexible draft data lives in:

- `StudentProfile.common_app_profile`

Main backend Common App modules:

- `backend/apps/users/common_app/schema.py`
- `backend/apps/users/common_app/progress.py`
- `backend/apps/users/common_app/builders.py`
- `backend/apps/users/common_app/sections/*`

Frontend `/common-app` consumes backend progress payloads and renders:

- section navigation
- conditional forms
- subsection completion
- restore/resume state

## Universities architecture

Primary user-facing models:

- `University`
- `StudentUniversity`
- `Application`

Supporting data/history:

- deadlines
- metrics
- source snapshots

Important current rule:

- user-facing university endpoints are restricted to `is_active=True`

Current product-access layer:

- formal backend plan / entitlement model exists in `backend/apps/accounts/*`
- plan assignments are stored per user through `UserPlanAssignment`
- frontend receives plan and usage summary through `/api/auth/profile/`
- server-side free preview limits are already enforced

Current free preview defaults:

- `my universities`: max `2`
- `discover universities` visible count: `6`
- `essays.max_count`: `1`
- `essay_versions.max_per_essay`: `5`
- `ai.requests.monthly_limit`: `10`

## Dashboard architecture

Dashboard is both:

- a live admissions-control surface
- a shareable/exportable snapshot surface

Key UI pieces:

- admissions score / donut
- readiness and next-step cards
- university shortlist summary
- snapshot export/copy/save

Important recent work:

- dashboard share snapshot and donut were heavily redesigned
- dark mode and localization were added
- snapshot export has a dedicated stable render path

Known open UI issue:

- the interactive donut tooltip can still shift layout when shown inside the card and should be moved to a non-layout-affecting overlay

## Documents architecture

Documents are intentionally simpler than essays.

Core model:

- `Document`

Current behavior:

- uploads
- rename
- delete
- document typing
- optional link to a university
- production object-storage support

Security hardening already added:

- file-type allowlist
- production uploads disabled if object storage is not configured

## Essays architecture

Core model layer:

- `Essay`
- `EssayVersion`

Implemented:

- versioned drafts
- autosave
- compare baseline
- editor workspace

Still incomplete:

- deeper AI version actions
- score/review loop
- stronger university/deadline context linkage

## Community architecture

Community is currently a product module, not a separate platform.

Implemented:

- seeded/applicant groups
- main chat surface
- posts/comments/report flow

Security/privacy hardening already added:

- safer public author payloads
- throttled report endpoint

Still open:

- stronger privacy model decisions before scale

## Security / abuse architecture

Current hardening already present:

- unique normalized identity mapping for auth
- password validation on registration
- throttling on auth, analytics, uploads, reports
- reduced token lifetime
- Sentry `send_default_pii=False`
- upload allowlist
- active-only university exposure
- redacted AI logs

Still open:

- full HttpOnly-cookie auth architecture
- production billing / payment provider integration
- deeper abuse controls across essays/community/tasks

## Infrastructure

Current live infra:

- Vercel: frontend
- Railway: backend + Postgres + Redis
- Cloudflare R2: documents

Current operational truth:

- Railway backend is a controlled deploy surface
- Vercel frontend deploys are separate from local push state
- custom domain is not yet the central documented production path
- current `main` can be ahead of the latest deployed frontend

## Current architectural debt

Main debt is not the stack.

Main debt is:

- incomplete payment / subscription integration on top of the existing entitlement model
- incomplete localization cleanup
- incomplete Common App parity
- incomplete essays advanced loop
- documentation drift vs real code

## Current direction

The correct next architectural sequence is:

1. add production billing / payment-provider integration on top of the existing account-plan model
2. keep limits enforced server-side first, then continue polishing limit-state UX
3. finish Common App and essays depth
4. clean old mojibake and docs drift
5. keep production deploys deliberate and small
