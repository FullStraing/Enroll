# Architecture

## Overview

Enroll uses a split product architecture:
- Backend: Django + DRF for auth, data models, business rules, ingestion commands, and admin
- Frontend: Next.js App Router for the full user-facing application
- Database: PostgreSQL as the main system of record

Django owns persistence and business logic. Next.js owns the product interface.

## High-level flow

1. Public user lands on `/`
2. Unauthenticated CTA can route into `/intro-quiz`
3. User registers or logs in
4. Protected workspace opens in Next.js
5. Frontend reads and writes product state through Django API endpoints

## Backend structure

Location: `backend/apps/`

Main apps:
- `core` - health, identity, and API aggregation
- `users` - auth, profile, password change, Common App progress
- `universities` - catalog, deadlines, metrics, source snapshots, ingestion
- `tasks` - roadmap stages, task generation, planning support
- `documents` - document objects and versions
- `essays` - essays, versions, compare logic
- `ai` - baseline AI endpoints

## Frontend structure

Location: `frontend/app/`

Main route groups:
- public marketing and acquisition: landing, intro quiz, legal pages
- auth: login, register
- workspace: dashboard, applications, calendar, documents, essays, common app, settings
- support / design surfaces: pilot, UI Lab

Shared UI entry points:
- `frontend/components/app-shell.tsx`
- `frontend/components/protected-page.tsx`
- `frontend/components/ui/*`
- `frontend/components/common-app/*`

## Auth model

Backend:
- JWT endpoints are exposed by DRF SimpleJWT
- protected API endpoints use standard auth permissions

Frontend:
- token is stored in `localStorage` and mirrored into a non-HttpOnly cookie for frontend bootstrap
- protected pages are guarded at the app layer
- bootstrap logic determines whether to show workspace or redirect to auth

## Common App architecture

The Common App system is backend-driven.

### Data shape
- typed fields live on `StudentProfile`
- flexible draft data lives in `StudentProfile.common_app_profile`

### Schema and progress engine
The implementation is intentionally modular:
- `backend/apps/users/common_app/schema.py`
- `backend/apps/users/common_app/progress.py`
- `backend/apps/users/common_app/builders.py`
- `backend/apps/users/common_app/sections/profile.py`
- `backend/apps/users/common_app/sections/family.py`
- `backend/apps/users/common_app/sections/education.py`
- `backend/apps/users/common_app/sections/testing.py`
- `backend/apps/users/common_app/sections/activities.py`
- `backend/apps/users/common_app/sections/writing.py`

This split exists to avoid keeping all Common App logic inside a monolithic `users/views.py`.

### Frontend behavior
`/common-app` consumes the backend progress payload and renders:
- section navigation
- subsection forms
- conditional visibility
- per-section completion
- persisted position / resume behavior

## Essays architecture

Core model:
- `Essay`
- `EssayVersion`

Current implemented behavior:
- one essay has many versions
- latest version acts as the working draft
- older versions are immutable snapshots
- compare endpoint exposes diff-ready data
- frontend workspace handles autosave and editing

Product intent:
- make essays feel closer to a versioned workspace than a plain text field

## University data architecture

University data is layered rather than flat.

Primary fast-read model:
- `University`

Supporting ingestion/history layer:
- deadlines
- metrics
- source snapshots
- media/source references
- scrape/ingestion run logs

This allows the product to show clean cards in the UI while still retaining source and enrichment history.

## Planning architecture

Tasks and calendar are connected product surfaces:
- tasks are API-backed
- calendar aggregates actionable planning state
- dashboard is intended to become the main orchestration surface tying profile readiness, deadlines, essays, and tasks together

## Legal and top-of-funnel surfaces

Current public/legal surfaces include:
- landing page
- intro quiz
- privacy policy

The intro quiz is intentionally outside auth to reduce initial friction and improve activation.

## Current architectural debt

The main architectural risk is not stack choice. The stack is already correct for the product.

The remaining debt is in completion and refinement:
- finish Common App parity
- further reduce oversized files in both backend and frontend domains where needed
- harden session, validation, and error handling
- add stronger production observability and test coverage

## Current direction

The correct next architectural moves are incremental:
1. finish modular Common App implementation
2. strengthen dashboard orchestration logic
3. complete essays advanced workflow
4. harden the existing platform for production

No stack rewrite is needed.
