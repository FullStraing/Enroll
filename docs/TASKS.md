# Р—Р°РґР°С‡Рё (РїРѕ MVP_SPEC.md)

## РљРѕРЅС‚РµРєСЃС‚ Рё С‚СЂРµР±РѕРІР°РЅРёСЏ
- РќР°РІРёРіР°С†РёСЏ РјРµР¶РґСѓ РѕСЃРЅРѕРІРЅС‹РјРё СЃС‚СЂР°РЅРёС†Р°РјРё РґРѕР»Р¶РЅР° Р±С‹С‚СЊ СЃРІСЏР·Р°РЅР°: РіР»Р°РІРЅР°СЏ РєРѕРЅСЃРѕР»СЊ в†” Applications UI.

## РЎРґРµР»Р°РЅРѕ
- Auth + Р±Р°Р·РѕРІР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР° РїСЂРѕРµРєС‚Р°.
- StudentProfile CRUD.
- Applications CRUD (С‚РѕР»СЊРєРѕ РёР· My Universities) + deadline.
- Tasks CRUD + РіРµРЅРµСЂР°С†РёСЏ Р·Р°РґР°С‡ РёР· С€Р°Р±Р»РѕРЅРѕРІ.
- Documents + Versions.
- AI endpoints (stub).
- UI СЃС‚СЂР°РЅРёС†С‹ РґР»СЏ СЃС‚СЂСѓРєС‚СѓСЂС‹: Dashboard, Onboarding, Universities, Tasks, Documents, Common App Draft.
- РњРёРЅРёРјР°Р»СЊРЅС‹Р№ UI РґР»СЏ РїСЂРѕРІРµСЂРѕРє: `/app/` Рё `/applications-ui/` (СЃ РЅР°РІРёРіР°С†РёРµР№).
- РџСѓР±Р»РёС‡РЅС‹Р№ Р»РµРЅРґРёРЅРі Enroll AI + СЃС‚СЂР°РЅРёС†С‹ РІС…РѕРґР°/СЂРµРіРёСЃС‚СЂР°С†РёРё.
- Р›РµРЅРґРёРЅРі РѕР±РЅРѕРІР»С‘РЅ РїРѕ `docs/ENROLL_UI_REFERENCE.md` (РЅРѕРІР°СЏ РЅР°РІРёРіР°С†РёСЏ, РєР°С‚Р°Р»РѕР¶РЅС‹Рµ РєР°СЂС‚РѕС‡РєРё, СЃС‚РѕСЂРёР±Р»РѕРє, FAQ, С‚Р°СЂРёС„, С„СѓС‚РµСЂ).
- РћР±РЅРѕРІР»С‘РЅ РІРёР·СѓР°Р» РІРЅСѓС‚СЂРµРЅРЅРёС… UI СЃС‚СЂР°РЅРёС† (Dashboard, Onboarding, Universities, Tasks, Documents, Common App) РїРѕРґ РµРґРёРЅС‹Р№ СЃС‚РёР»СЊ.
- Р”РѕР±Р°РІР»РµРЅС‹ РЅР°СЃС‚СЂРѕР№РєРё РїСЂРѕС„РёР»СЏ: Settings СЃС‚СЂР°РЅРёС†Р°, СЃРјРµРЅР° РїР°СЂРѕР»СЏ, РІС‹С…РѕРґ РёР· Р°РєРєР°СѓРЅС‚Р°.
- Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ `frontend/` РЅР° Next.js РґР»СЏ Р±РµР·РѕРїР°СЃРЅРѕР№ РїРѕСЌС‚Р°РїРЅРѕР№ РјРёРіСЂР°С†РёРё Р±РµР· РѕС‚РєР»СЋС‡РµРЅРёСЏ С‚РµРєСѓС‰РµРіРѕ Django UI.
- Р РµР°Р»РёР·РѕРІР°РЅ РїРѕР»РЅРѕС†РµРЅРЅС‹Р№ `Calendar` СЌРєСЂР°РЅ РІ Next.js: Month/Week view, events (`task` + `deadline`), quick input `/task`, С„РёР»СЊС‚СЂС‹, drag&drop Р·Р°РґР°С‡ РїРѕ РґРЅСЏРј, Today/Next7 panel Рё Timeline 14 РґРЅРµР№.
- РћР±РЅРѕРІР»С‘РЅ backend serializer Р·Р°РґР°С‡: РІ API `/api/tasks/` С‚РµРїРµСЂСЊ РІРѕР·РІСЂР°С‰Р°РµС‚СЃСЏ СЃРІСЏР·Р°РЅРЅР°СЏ `application` РґР»СЏ С„РёР»СЊС‚СЂР°С†РёРё РїРѕ РІСѓР·Сѓ РЅР° РєР°Р»РµРЅРґР°СЂРµ.
- РњР°СЂС€СЂСѓС‚ `/tasks` СЃРѕС…СЂР°РЅС‘РЅ РєР°Рє СЃРѕРІРјРµСЃС‚РёРјС‹Р№ redirect РЅР° `/calendar`.
- Django РІРёР·СѓР°Р»СЊРЅС‹Рµ С€Р°Р±Р»РѕРЅС‹ СѓРґР°Р»РµРЅС‹, `backend/config/urls.py` РїРµСЂРµРІРµРґС‘РЅ РІ API/admin СЂРµР¶РёРј.
- РћРїС‚РёРјРёР·РёСЂРѕРІР°РЅР° РЅР°РІРёРіР°С†РёСЏ РІ Next.js: auth/session bootstrap РІС‹РЅРµСЃРµРЅ РІ РµРґРёРЅС‹Р№ `AuthProvider`, СѓР±СЂР°РЅС‹ РїРѕРІС‚РѕСЂРЅС‹Рµ full-screen РїСЂРѕРІРµСЂРєРё РјРµР¶РґСѓ Р·Р°С‰РёС‰С‘РЅРЅС‹РјРё СЃС‚СЂР°РЅРёС†Р°РјРё, РїСЂРѕС„РёР»СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РєСЌС€РёСЂСѓРµС‚СЃСЏ РІ РєРѕРЅС‚РµРєСЃС‚Рµ.

## Р”Р°Р»СЊС€Рµ РїРѕ MVP (РёР· MVP_SPEC.md)
- Р”РѕРІРµСЃС‚Рё СЌС‚Р°Рї C РґРѕ С„РёРЅР°Р»СЊРЅРѕРіРѕ UX-РїРѕР»РёС€Р° (legend, С†РІРµС‚РѕРІС‹Рµ РїСЂР°РІРёР»Р°, СЃС‚Р°С‚СѓСЃРЅС‹Рµ badge-РїР°С‚С‚РµСЂРЅС‹, Р±С‹СЃС‚СЂС‹Р№ inline-edit Р·Р°РґР°С‡).
- Р­С‚Р°Рї D: Documents + versions polish (С„РёРЅР°Р»СЊРЅР°СЏ РІРµСЂСЃРёСЏ, СѓРґРѕР±РЅРѕРµ РєРѕРїРёСЂРѕРІР°РЅРёРµ/СЌРєСЃРїРѕСЂС‚, СЏРІРЅР°СЏ СЃРІСЏР·СЊ РІРµСЂСЃРёР№ СЃ РІСѓР·Р°РјРё).
- Р¤РёРЅР°Р»РёР·Р°С†РёСЏ Applications workflow (РїРѕСЃР»РµРґРЅРёР№ СЌС‚Р°Рї Р±РёР·РЅРµСЃ-Р»РѕРіРёРєРё).

- Добавлен sales-pack для 14-дневного запуска в docs/sales/ (оффер, скрипты, FAQ, demo script, KPI tracker, CRM template).
- Обновлен landing под trial-оффер и CTA Записаться в пилот, добавлена публичная страница /pilot.



## Added: Niche full-data scraper

- Added storage layers for snapshots, per-section payloads, normalized metrics, media refs, and run logs.
- Added internal API endpoints for latest snapshot and metrics.
- Added Playwright session bootstrap + scrape + reparse commands.
- Applications cards now render freshness and cost/housing summary when metrics are available.


## Ingestion automation update

- Added licensed provider connector layer (`base`, `licensed_feed`, `niche_fallback`).
- Added automated ingestion commands (full, delta, backfill, quality report).
- Added APScheduler fallback command for weekly full + daily delta jobs.
- Added quality gate: run/item cannot be marked success without admissions + cost/housing coverage.
- Added safe cleanup script and `.gitignore` updates (`backend/.secrets`, `tmp`, logs) without deleting `node_modules`.

- Added Niche-first queue automation: Celery task `scrape_niche_university_task`, enqueue commands (full/delta/recovery), and APScheduler command `run_niche_scheduler`.

## Update: GradGPT as primary scraping source

- Added `scrape_gradgpt_universities` command to ingest from `https://www.gradgpt.com/common-data-set`.
- Added `gradgpt_scraper` service to collect full page payload (headings, paragraphs, lists, key-values, id-values, media).
- Persist layer now supports `source=gradgpt` / `source_provider=gradgpt`.
- Niche flow remains in codebase only as legacy fallback; active ingestion should use GradGPT command.
- Added strict per-university standard profile (admissions, important factors, campus diversity, costs/living/fees) with completeness scoring.
- Added quality reason codes in run items: `MISSING_ADMISSIONS_CORE`, `MISSING_COSTS_CORE`, `MISSING_IMPORTANT_FACTORS`, `MISSING_CAMPUS_DIVERSITY`.
- Updated Next.js `applications` page with full university cards and expandable details blocks (Admissions, Important Factors, Costs/Living/Fees, Campus Diversity, Quality + raw JSON).
- Fixed GradGPT acceptance-rate mapping priority to use `cds-raw admissions.acceptance_rate` (prevents incorrect shared values).
- Added server-side pagination for `/api/universities/` and UI pagination on `/applications` to reduce heavy page lag.
- Added official-first admission deadlines ingestion pipeline with typed deadlines (`EA/ED1/ED2/RD/Transfer/Priority/Rolling`) and API endpoint `/api/universities/{id}/deadlines/`.
- Switched deadlines ingestion primary source to Peterson's (`--source petersons`) with table parser for `Application Closing`, `Notification Date`, and `Rolling Admissions`.
- Added Peterson profile enrichment command for missing blocks in cards: `Location & Contact`, `Majors & Degrees`, `Applying/Admission Requirements`, `Female/Male Admissions`, `Test policy`, `Financial Aid`, `Campus Life`, `Athletics`, plus GPA backfill metric (`avg_gpa`).

## Essays roadmap progress (2026-03-04)

- Implemented Phase 1 foundation:
  - New backend app `apps.essays` with `Essay` and `EssayVersion` models.
  - API routes for essay manager and versions.
  - Auto-created `v1 Initial draft` on essay creation.
- Implemented Phase 3 (without AI):
  - New Next.js page `/essays` as Essay Manager.
  - Card-based list of essays with versions count and last edited timestamp.
  - `+ New Essay` flow with supplemental essay validation fields.
- Implemented Phase 4 baseline:
  - New Next.js workspace `/essays/[id]`.
  - Left panel versions list + create new version.
  - Center editor with autosave and manual save.
  - Right panel compare mode (`vX vs vY`) with line-based diff view.

## Essays onboarding progress (2026-03-05)

- Started Phase 2 (First-time Onboarding):
  - Added user preference flag `essays_onboarding_seen` in `StudentProfile`.
  - Added onboarding modal on `/essays` with adaptive demo duration (~24s).
  - Added Watch demo / Skip / Continue actions.
  - On skip/complete, preference persists via `/api/auth/profile/` PATCH.

## Essays workspace layout progress (2026-03-05)

- Started Phase 5:
  - Added explicit right-side `AI Mentor` placeholder panel in `/essays/[id]`.
  - Added Show/Hide toggle for right panel with localStorage persistence.
  - Added mobile-friendly collapsed section (`details/summary`) for AI+Compare content.
  - Kept compare UI inside right panel as MVP placeholder until dedicated compare API phase.

## Essays editor progress (2026-03-05)

- Started Phase 7.1:
  - Integrated Rich Text Editor (Tiptap) in `/essays/[id]` workspace.
  - Added formatting toolbar (paragraph, bold, italic, bullet list, ordered list).
  - Autosave now persists editor HTML content.
  - Word count is computed from plain text extracted from editor content.
  - Diff view now renders text-normalized compare output (not raw HTML tags).

## Essays versions progress (2026-03-05)

- Phase 6 improved:
  - Added version status model (`draft`, `revised`, `ai_improved`, `final`).
  - Implemented `is_latest` helper in version API payload.
  - Enforced read/write rule: only latest version can be edited.
  - Added final-version uniqueness behavior (single `final` per essay).
  - Updated workspace UI to show status and read-only state for old versions.

## Essays autosave hardening progress (2026-03-05)

- Started Phase 7.2:
  - Added retry/backoff logic for autosave persistence (3 attempts).
  - Added anti-race guard so stale autosave responses do not overwrite latest state.
  - Added explicit `retrying` save state in UI.
  - Manual `Save now` now uses the same hardened persistence path.

## Essays word target UX progress (2026-03-05)

- Started Phase 7.3:
  - Added target state evaluation (`start`, `below`, `on target`, `over target`).
  - Added visual target badge and progress bar in workspace.
  - Added contextual word guidance hints based on current count vs target.

## Essays compare API progress (2026-03-05)

- Started Phase 9.1:
  - Added backend endpoint `/api/essays/{id}/compare/` with `from_version` + `to_version`.
  - Added owner-scope validation and response payload for diff rows.
- Updated workspace compare panel to consume backend compare endpoint.
- Added frontend fallback to local compare if endpoint call fails.

## Dashboard Common App progress start (2026-03-05)

- Added backend profile draft storage:
  - `StudentProfile.common_app_profile` (JSON draft for Common App-only fields).
- Added new endpoint:
  - `GET /api/auth/common-app-progress/` with section/subsection/field completion.
- Dashboard now shows:
  - overall required completion
  - progress by section (Profile, Family, Education)
  - subsection forms with inline help text and save actions.
- Dashboard saves subsection data through `PATCH /api/auth/profile/` (model + json merge).

## Common App update (2026-03-07)

- Added persistent step restore for Common App (`/common-app`): current subsection + scroll position are restored after page reload.
- Replaced `Education -> Other Secondary/High Schools` with structured manual-entry flow (count 0..3, school name/date blocks, reason field), explicitly without any school finder button.
- Replaced `Education -> Colleges & Universities` with structured manual-entry flow (count 0..3, per-college details, dates, degree earned), explicitly without any college finder button.
- Expanded `Education -> Grades` to Common App-like structure:
  - class size
  - class rank reporting (Exact/Decile/Quintile/Quartile/None)
  - conditional rank fields and rank weighting
  - GPA scale reporting, cumulative GPA, GPA weighting
- Expanded `Education -> Current or Most Recent Year Courses`:
  - dynamic course count (1..15)
  - per-course subject/name/level
  - per-course schedule with schedule-system-specific options
  - fixed visibility bug by introducing compound condition support (`all`/`any`) in backend and frontend condition evaluators.
- Expanded `Education -> Honors`:
  - Yes/No gate
  - honors count (1..5)
  - per-honor title, grade levels, recognition levels
- Expanded `Education -> Community-Based Organizations`:
  - organization count (0..3)
  - per-organization advisor block (prefix, name, email, phone with code/number/extension)
- Added grouped visual separators in Common App step renderer for repeating blocks (`Course N`, `College N`, `Sibling N`, `Secondary/High School N`, `Honors N`, `Counselor/Advisor/Mentor N`) to reduce user confusion.

- Common App backend refactor in progress: extracted large schema/progress logic from `backend/apps/users/views.py` into `backend/apps/users/common_app/` package.
- Added schema modularization by section:
  - `common_app/sections/profile.py`
  - `common_app/sections/family.py`
  - `common_app/sections/education.py`
  - `common_app/sections/testing.py`
  - `common_app/sections/activities.py`
  - `common_app/sections/writing.py`
- Added shared builders module: `common_app/builders.py`.
- `views.py` now keeps only API views + import of `build_common_app_progress`.
- Verified refactor stability with automated checks:
  - `USE_SQLITE=1 python backend/manage.py check`
  - `USE_SQLITE=1 python backend/manage.py test apps.users` (all tests green)
  - `npm run lint` (frontend; only existing `<img>` warnings remain).

## Landing intro quiz flow (2026-03-07)

- Added new route: `frontend/app/intro-quiz/page.tsx`.
- Implemented a Duolingo-like multi-step onboarding quiz (7 steps) before auth:
  1. Country
  2. Current school level/class
  3. Planned US start year
  4. Intended major (with `Еще не определился`)
  5. GPA format + conditional value input (4.0 / 5.0 / percent / unknown)
  6. Standardized tests (multi-select)
  7. Shortlist size target
- Added lightweight mascot placeholder block with greeting text (reserved place for future character asset).
- Added local persistence for progress + answers (`localStorage`) so user can refresh and continue.
- Added completion screen with auth-aware CTA:
  - authenticated -> Dashboard
  - unauthenticated -> Register / Login
- Updated landing CTA path for unauthenticated users:
  - `frontend/app/page.tsx`: `Начать` now routes to `/intro-quiz` (instead of direct `/register`).
- Added legal/privacy page and links:
  - new route: `frontend/app/privacy-policy/page.tsx`
  - linked from landing footer
  - linked from Settings -> Legal block
