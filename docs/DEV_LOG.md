# Dev Log

Lightweight session log for preserving short-term context across development sessions.

## 2026-03-14

- Added project-level Serena MCP config in `.mcp.json` (Codex context).
- Added startup protocol in `docs/SERENA_MCP.md`.
- Updated `AGENTS.md` to require Serena activation before coding.
- Established this log file for ongoing context notes.
- Installed `uv` locally via `python -m pip install --user uv`.
- Validated Serena startup command with `python -m uv tool run --from git+https://github.com/oraios/serena serena-mcp-server --help`.
- Implemented Common App `writing` flow inside `/common-app` without changing the separate `Essays` page.
- Added Writing schema fields for acknowledgement, prompt selection, essay draft, and additional information.
- Added a dedicated frontend writing renderer with rich text editing, prompt selection, and word count guidance.
- Verified with `manage.py check`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- Backend tests could not run in this environment because Postgres test database creation is not permitted for the current DB user.
- Registered Serena globally for Codex in `C:\Users\user\.codex\config.toml` via `codex mcp add serena`.
- Added `scripts/session-start.ps1` to validate Serena before each work session and optionally append a log entry.

- Session start 2026-03-14 11:24: Serena preflight passed.

## 2026-03-17

- Activated Serena for the Enroll project before UI work.
- Started university media MVP with local logo assets and a shared `UniversityLogo` component.
- Added clean university logo rendering to Discover cards and to the `My Universities` table with a graceful initials fallback.
- Refined `Edit table` state persistence so sort and visible columns survive route changes without reverting on first render.
- Removed the placeholder `Filters` section from `Edit table` and aligned category sorting to the intended order: High Reach, Reach, Target, Likely, Safety.
- Replaced the old `/calendar` grid-based experience with a simpler Todoist-style task workspace focused on fast task capture, Today/Upcoming/Inbox/Completed lists, and one-click completion.
- Rebuilt the landing page into a modular Ben Hunt-style structure with editable marketing content in `frontend/app/landing-content.ts` and reusable product preview blocks prepared for future real screenshots.

- Session start 2026-03-18 12:46: Serena preflight passed.

- Session start 2026-03-19 13:32: Serena preflight passed.

## 2026-03-19
- Dashboard Edit Profile modal restyled to match Enroll UI Lab: removed gradients, simplified surfaces, kept only approved accent colors (#FFDB58, #DAF5F0, #F8D6B3, #FFF4CC), and verified with frontend lint/build.

- Dashboard Edit Profile stats redesigned into grouped Academic Tests, Language Tests, and AP Exams. Added persistent dashboard snapshot storage in common_app_profile for ACT, extra language tests, and AP scores; verified with frontend lint/build.

- Dashboard Edit Profile modal now closes on outside click, uses a fixed bottom save bar, enforces official score ranges for SAT/ACT/language tests, and shows grouped academic/language/AP data in the dashboard snapshot.

- Fixed dashboard exam input UX: score fields no longer snap to min/max during typing. Input stays editable, validation commits on blur/save, and build/lint remain clean.


- Session start 2026-03-19 14:29: Serena preflight passed.
- Refactored dashboard architecture: moved types/constants/utils into app/dashboard modules, extracted snapshot card and edit-profile modal into components, and reduced frontend/app/dashboard/page.tsx from 1586 lines to 689 while keeping behavior stable. Verified with frontend lint/build.

- Edit Profile modal now supports collapsing individual sections with local persistence, so users can hide blocks that distract them while editing. Verified with frontend lint/build.

- Fixed frontend dev-runner stability: 
pm run dev no longer wipes .next on every start, which was causing intermittent _next/static/* 404s after reload/restart. Added manual 
pm run dev:clean for explicit cache resets. Verified with frontend lint/build.

- Fixed dashboard country flag rendering by replacing mojibake flag strings with Unicode escape mappings. Verified with frontend lint/build before push.


- 2026-03-19: Cleaned dashboard snapshot so tests appear only once in the top summary; removed duplicate lower test/AP display and normalized remaining dashboard copy/encoding.

- 2026-03-19: Extended dashboard snapshot summary to show all entered academic and language test results as compact chips when multiple scores exist, without reintroducing duplicate test blocks.

- 2026-03-19: Added Activities discovery MVP page with CA/CIS-focused filters, curated seed opportunities, and dedicated navigation route. Designed as a clean discovery board to later replace seed data with verified sources and deadlines.

- 2026-03-19: Fixed Activities page copy and layout. Unified user-facing language to Russian, added explicit WIP notice, and stabilized opportunity card action alignment so buttons no longer drift.

- 2026-03-19: Switched Activities page copy back to English-only ahead of future localization work, removed the Next step card, and kept the page-level WIP notice.

- 2026-03-19: Connected Activities page to profile data. Students can now add curated opportunities directly into profile.activities, track selected recommendation IDs through common_app_profile, and see those entries reflected in Dashboard snapshot and Edit profile.

- 2026-03-19: Polished Dashboard snapshot presentation: honors now render in a wider full-width block instead of narrow pills, and university status badges now reuse the same status tones as the Universities page in both the snapshot card and Edit Profile modal preview.

- 2026-03-19: Fixed Edit Profile modal actions layout. Replaced the viewport-fixed footer with a stable modal footer so Close and Save buttons stay visible while the form body scrolls independently.

- 2026-03-19: Stabilized Edit Profile modal sizing. Removed persisted collapsed-section state and constrained the modal cleanly to the viewport so the full form and footer fit without clipping.

- 2026-03-19: Fixed app-wide bottom clipping. Removed dashboard modal body scroll-lock and switched shared shell/background height calculations from vh to dvh so pages use the real visible viewport and stop hiding the lower part of the interface.
