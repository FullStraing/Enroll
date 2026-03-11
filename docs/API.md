# API

Base prefix: `/api/`

## Authentication and session

### Health and identity
- `GET /api/ping/`
- `GET /api/me/`

### Auth
- `POST /api/auth/register/`
- `POST /api/auth/google/`
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/profile/`
- `PATCH /api/auth/profile/`
- `PUT /api/auth/profile/`
- `POST /api/auth/change-password/`
- `GET /api/auth/common-app-progress/`

Notes:
- `register` is public.
- `google` is public and exchanges Google `id_token` -> local JWT (`access`, `refresh`).
- `token` / `token/refresh` are JWT endpoints.
- `profile`, `change-password`, and `common-app-progress` require auth.

## Universities

### University catalog
- `GET /api/universities/`
- `GET /api/universities/{id}/`
- `GET /api/universities/{id}/deadlines/`
- `GET /api/universities/{id}/metrics/`
- `GET /api/universities/{id}/source-snapshot/`

Typical frontend usage:
- list with pagination and search
- detail page with admissions/cost/housing sections
- deadline rendering
- debugging or inspection of enriched source data

Common enriched metric keys in `/api/universities/{id}/metrics/` now include:
- `application_fee_usd`
- `application_fee_text`
- `applying_extended` (JSON rows from Applying block)
- `financial_aid_items` (JSON rows from Financial Aid block)

`GET /api/universities/` query params:
- `page`, `page_size`, `q`
- `selectivity` (`high|medium|low`)
- `acceptance_min`, `acceptance_max`
- `avg_sat_min`, `avg_sat_max`
- `avg_act_min`, `avg_act_max`
- `avg_gpa_min`, `avg_gpa_max`
- `net_price_min`, `net_price_max`
- `tuition_min`, `tuition_max`
- `housing_min`, `housing_max`

### Student shortlist
- `GET /api/my-universities/`
- `POST /api/my-universities/`
- `GET /api/my-universities/{id}/`
- `PUT /api/my-universities/{id}/`
- `DELETE /api/my-universities/{id}/`

### Applications
- `GET /api/applications/`
- `POST /api/applications/`
- `GET /api/applications/{id}/`
- `PUT /api/applications/{id}/`

## Tasks and planning

- `GET /api/roadmap-stages/`
- `GET /api/tasks/`
- `POST /api/tasks/`
- `PUT /api/tasks/{id}/`
- `DELETE /api/tasks/{id}/`
- `POST /api/tasks/generate/`

Notes:
- `/calendar` in the frontend consumes task and deadline data.
- task generation exists as a baseline workflow endpoint.

## Documents

- `GET /api/documents/`
- `POST /api/documents/`
- `GET /api/documents/{id}/`
- `PATCH /api/documents/{id}/`
- `PUT /api/documents/{id}/`
- `DELETE /api/documents/{id}/`
- `GET /api/documents/{document_id}/versions/`
- `POST /api/documents/{document_id}/versions/`

## Essays

- `GET /api/essays/`
- `POST /api/essays/`
- `GET /api/essays/{id}/`
- `PATCH /api/essays/{id}/`
- `PUT /api/essays/{id}/`
- `DELETE /api/essays/{id}/`
- `GET /api/essays/{essay_id}/versions/`
- `POST /api/essays/{essay_id}/versions/`
- `GET /api/essay-versions/{id}/`
- `PATCH /api/essay-versions/{id}/`
- `PUT /api/essay-versions/{id}/`
- `GET /api/essays/{essay_id}/compare/?from_version={id}&to_version={id}`

Current behavior:
- essays own many versions
- latest version is the active editable surface
- previous versions are preserved as snapshots
- compare is owner-scoped

## AI

Current baseline endpoints:
- `POST /api/ai/next-step/`
- `POST /api/ai/document-draft/`
- `POST /api/ai/document-feedback/`
- `POST /api/ai/commonapp-draft/`

These exist as API surface, but product-grade AI flows are still incomplete.

## Common App progress payload

`GET /api/auth/common-app-progress/` returns:
- overall completion summary
- section-level progress
- subsection-level progress
- field metadata for rendering
- field visibility and conditional-required state
- current saved values

This endpoint is the backend-driven contract behind `/common-app` and dashboard readiness widgets.

## Auth expectations

Most endpoints require JWT auth.

The frontend is the primary consumer of this API and handles:
- token bootstrap
- protected routing
- session cookie/localStorage synchronization

## Current API stability note

The current API is stable enough for the existing frontend, but it is not yet treated as a frozen public third-party API. Internal contracts can still be refined while Common App, Dashboard, and Essays are being completed.
