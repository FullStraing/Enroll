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

- 2026-03-19: Found a broader shell-level cause for bottom clipping. The main AppShell content panel was still hard-pinned to viewport height, which kept last content rows flush to the screen edge. Removed the forced full-height on the shared section and now clear any stale html/body overflow locks on route change.

- 2026-03-19: Added app-wide scroll safety: body now explicitly uses vertical scrolling with hidden horizontal overflow, and AppShell content gets extra bottom padding so final rows/cards do not sit flush against the viewport edge.

- 2026-03-19: Removed the forced full-viewport height from the shared AppShell wrapper. The shell now grows from content instead of stretching to the viewport, which should restore the visible bottom shadow/black edge under the main glass container on short pages.

- 2026-03-19: Identified a shadow-clipping issue in the shared shell. The main AppShell wrapper ended exactly at document bottom, so the outer black shadow was being clipped by the page edge. Added explicit bottom margin on the wrapper so the shell shadow has visible space below it.

- 2026-03-19: Increased bottom breathing room in the shared shell. The previous margin/padding fix helped but still clipped the final card/shadow on some pages, so AppShell now uses larger bottom spacing both outside the shell and inside the main section.

- 2026-03-19: Added an explicit bottom spacer inside the shared AppShell section. This guarantees physical room below the final page block so the last card shadow remains visible instead of being clipped at the viewport edge.

- 2026-03-19: Corrected the shell spacing strategy. Removed the extra internal spacer/padding from inside the main glass section and moved the breathing room outside the whole AppShell instead. Also removed body-level horizontal clipping so the outer shell shadow has room on the right edge again.

- 2026-03-19: Final shell spacing pass: increased external bottom space so users can scroll far enough to clearly see the end of the shared glass card, and normalized the outer horizontal gutters so right-side spacing stays visually consistent across app pages.

- Session start 2026-03-19 20:07: Serena preflight passed.

- 2026-03-19: Dashboard snapshot export now targets only the dedicated snapshot card, not the whole dashboard page. Added a separate Save image action for downloading the selected region and kept Share as a clipboard-first screenshot of that same card.

- 2026-03-19: Reworked dashboard snapshot export to use a dedicated offscreen fixed-size card. Share and Save image now render from the export target instead of the live interactive snapshot, which improves image consistency and output quality.

- 2026-03-19: Tightened dashboard snapshot composition by moving Honors into the right-side score panel. This reduces empty space around the circular score block and keeps the snapshot visually denser without adding new sections.

- Session start 2026-03-20 00:00: Serena preflight passed.

- 2026-03-20: Added dashboard snapshot university selection. Edit Profile now shows the full My Universities list, lets the user pick up to 7 universities for the shareable snapshot, and saves the chosen IDs into dashboard_snapshot so newly added universities can be selected without forcing the full list onto the card.

- 2026-03-20: Restored AP visibility in the dashboard snapshot. AP scores now render as compact chips inside the summary card so saved AP exams appear alongside the rest of the shareable profile data.

- 2026-03-20: Replaced the passive “Sections / 5 blocks” badge in Edit Profile with color-coded quick-jump buttons. Each button now matches its section tone and scrolls the modal directly to the selected block for faster navigation.

- 2026-03-20: Polished Edit Profile modal navigation and persistence. The section jump buttons now sit on a lower aligned row in the header, and the modal now autosaves profile changes after a short debounce while showing live autosave status in the footer.

- 2026-03-20: Restored the original Edit Profile header button placement after the lower aligned variant felt worse in use. Autosave remains enabled, but the quick-jump controls are back in their previous top-right layout.

- 2026-03-20: Added shared body scroll locking for overlay popups. Edit Profile, document rename, confirm dialogs, and essay compare/create-version modals now lock background scrolling so only the popup content moves while open.

- Session start 2026-03-20 18:35: Serena preflight passed.

- 2026-03-20: Moved dashboard snapshot actions into the snapshot score panel as a compact control group, replacing the long full-width buttons under the card.

- Session start 2026-03-20 20:11: Serena preflight passed.

- 2026-03-20: Reworked intro quiz flow so it stays required until answers are linked to an authenticated profile. Landing now routes to intro-quiz only before linking, login/register sync stored quiz answers into the backend profile on first auth, and dashboard can fall back to profile-backed intro quiz answers instead of depending only on local storage.

- 2026-03-20: Added a landing-page footer with animated Telegram and Instagram buttons powered by Lottie JSON assets from public/animations. Social actions now live in a dedicated reusable client component instead of inline page logic.

- 2026-03-20: Updated landing social Lottie buttons so animations no longer autoplay. They now play only on hover/focus and reset when the pointer leaves.

- 2026-03-23: Reduced visual noise on the Essays page as an experiment for a broader UI cleanup. Removed the heavy nested manager/create-card stack, switched the create area to a softer tinted section, and lightened essay list cards to rely more on spacing and typography than stacked black borders.

- 2026-03-23: Cleaned up the intro quiz persistence flow and landing source files. Replaced corrupted mojibake strings in the landing page and landing content config, fixed intro-quiz answer normalization maps so Russian quiz answers map correctly into the profile payload, removed the incorrect unauthenticated redirect from the quiz completion screen, and normalized landing social/footer copy. Also replaced the loader img tag with next/image so frontend lint and production build now pass without warnings.
