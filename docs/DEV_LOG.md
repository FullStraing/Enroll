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

- Session start 2026-03-23 10:31: Serena preflight passed.

- 2026-03-23: Added a lightweight dashboard session cache with a short TTL. Dashboard now restores the last successful payload from sessionStorage for instant rendering on revisit, skips redundant refetches while the cache is still fresh, and keeps the cache synchronized after local profile/data changes so the page no longer feels like a full reload on every navigation.

- Session start 2026-03-23 10:41: Serena preflight passed.

- 2026-03-23: Standardized the in-house session-cache pattern beyond dashboard. Added shared `frontend/lib/session-cache.ts` and applied short-TTL cache + write-through/invalidation behavior to Tasks/Calendar, Documents, Essays, Common App, Activities, Settings, and internal Onboarding. Mutations now clear related dashboard/settings/activities/onboarding caches where needed so revisit UX is faster without moving durable product data out of the backend profile/domain models.

- 2026-03-23: Added a persistent Enroll brand mark inside the dashboard snapshot surface so both exported images and manual screenshots clearly show the product source and are discoverable when shared externally.

- 2026-03-23: Standardized required-field indicators across the truly mandatory form fields. Added a reusable required mark component and applied it to auth, pilot signup, document upload, essay creation, and security password change flows, while keeping partial profile-edit surfaces free of fake mandatory markers.

- 2026-03-23: Softened dashboard cards and internal surfaces to reduce border noise, then cleaned the experiment back to the Enroll UI Lab palette only. Removed the ad-hoc off-palette neutrals from the new dashboard treatment and kept the lighter structure using only brand yellows, cyans, warm neutrals, and white.

- 2026-03-23: Tightened dashboard snapshot chip layout for export and smaller screens. `All Tests` and `AP Exams` pills now keep their labels on a single line with more stable spacing, so copied/saved images and narrow layouts no longer split short test labels awkwardly across lines.

- 2026-03-23: Swapped visible brand entry points to the new `public/brand/logo-mark.svg` asset and simplified the user-facing product wordmark from `Enroll AI` to `Enroll` in the app shell and landing header.

- 2026-03-23: Started a broader responsive cleanup pass across the shared shell and highest-risk mobile surfaces. Tightened the mobile sidebar width, stacked dashboard snapshot actions cleanly on small screens, relaxed the Discover universities card action area, and converted several fixed-width university detail grids into mobile-safe layouts.

- 2026-03-23: Removed the semi-transparent white shell from the landing container and restored a fully opaque page surface so the header/card background matches the rest of the product instead of reading as a glass layer.

- Tightened dashboard snapshot label rendering so All Tests and AP chips use non-breaking labels and stay stable in exports/mobile widths.

- Continued the responsive cleanup pass: made Edit Profile modal header/footer mobile-safe, stabilized snapshot chips, and improved Essay workspace toolbars, side panels, and comparison/version dialogs for phones and small tablets.

- Investigated a large repeated DevTools console error dump: fixed duplicate React keys in dashboard snapshot chips/lists and added a proper app icon to remove favicon 404 noise.

- Reworked Tasks hero so task capture is the primary focal point: enlarged the quick composer, improved CTA prominence, and compressed the right-side stats into a lighter support rail.

- Added a rotating typewriter-style placeholder to the Tasks quick composer so the main input demonstrates example admissions tasks before the user starts typing.

- Tuned the Tasks typewriter placeholder to animate faster and read slightly smaller, keeping the input focused without overpowering the user-entered text.

- Built a shared branded `Select` component in `frontend/components/ui/select.tsx` and replaced the remaining native `<select>` menus across the main product surfaces. Tasks, Universities, Essays, Documents, Activities, Dashboard Edit Profile, Common App fields, Onboarding, and Pilot now share one dropdown language instead of mixing browser-default menus with page-local styling.

- Fixed the shared custom select positioning logic so dropdowns no longer jump to the top of the viewport on lower rows. The menu now estimates its real content height, prefers opening below when viable, and only flips upward when there is clearly more usable space above.

- Stabilized the Tasks workspace for long lists. Each task section now keeps a controlled height with its own internal scroll area, so large Today/Inbox/Completed lists no longer stretch the whole page and break the layout rhythm.

- Updated task date behavior so quick-captured tasks default to today unless the user explicitly overrides the date. Added a durable `completed_at` timestamp to backend tasks and switched the Completed list to a compact `Done · Mar 24` style label sourced from real completion time instead of reusing the due-date pill.
- 2026-03-24: Tightened the Tasks mobile layout by adding safe header spacing under the floating menu button, trimming extra hero copy, and shrinking the quick-capture composer so the main task input stays readable on narrow phones.

- 2026-03-24: Reworked the mobile app shell into a proper left drawer. Navigation now opens as a slide-over panel with dimmed backdrop, while mobile header clutter (time, profile, logout) was moved into the drawer to keep page content clear.

- 2026-03-24: Fixed the mobile drawer regression by removing the duplicated desktop brand/toggle row from the slide-over, restoring proper drawer-only scrolling, and locking the page scroll while the drawer is open.

- 2026-03-24: Cleaned up the Documents mobile layout by restoring safe header spacing under the drawer button, shortening page/upload/readiness copy, and stacking document actions into a phone-friendly layout.

- 2026-03-24: Fixed an additional 360px Documents overflow case by forcing document grid columns and group cards to shrink with min-w-0, and trimmed the remaining mobile-only copy.

- 2026-03-24: Reworked the Essays top section into a tighter intro block with one clear CTA, reducing the empty header feel and removing redundant workspace labeling.
- 2026-03-24: Removed the user-facing UI Lab route and navigation entry while keeping the chosen Enroll UI system, tokens, and shared components intact as the active design source of truth.
- 2026-03-24: Connected Redis as the standard Django cache backend with a safe local-memory fallback, and extended `/api/ping/` to report cache backend/status so Redis wiring is observable during local and production setup.
- 2026-03-24: Fixed the slow-feeling essay creation flow. Essay create now returns the real initial version from the backend, writes both the essays list and essay-detail session caches immediately, and opens the new workspace from cached state instead of waiting on a cold detail refetch.
- 2026-03-24: Fixed an intermittent Essays empty-state bug caused by prematurely writing an empty list into session cache on first render. The essays page now waits until real data or a real cached payload has hydrated before persisting list cache back to sessionStorage.
- 2026-03-24: Added Essay Coach MVP. Backend now exposes dedicated essay AI endpoints for starter draft, selected-text feedback, prompt explanation, and outline guidance through the existing `apps.ai` layer, with OpenAI Responses API wiring, per-action daily limits, structured JSON responses, and interaction logging. Frontend essay workspace now has visible guided AI actions, selection-based improvement preview/apply flow, and AI-created starter drafts as separate essay versions.
- 2026-03-24: Switched Essay Coach backend to a provider-agnostic AI service layer. Gemini is now the default provider through `AI_PROVIDER=gemini`, OpenAI remains an optional fallback, and the existing per-action daily limits continue to hard-cap usage before any provider call. This keeps local development safe and lets production enable Gemini with only `GEMINI_API_KEY` plus optional model overrides.
- 2026-03-24: Tightened the Essay Coach starter-draft contract so the model returns a shorter, more usable starter package: `starting_angle`, `why_this_works`, and `next_focus` instead of long meta-analysis. Also converted the Essay Coach popup into a proper scrollable side panel with bounded height so it fits on screen and remains usable on smaller viewports.
- 2026-03-24: Simplified the Essay AI UX so the page now has one coherent `Essay Coach` entry point instead of scattered top-level AI buttons. Starter draft, prompt explanation, outline generation, and selected-text improvements now live inside the coach panel, while the editor surface only shows a compact selection notice plus an entry into the coach.
- 2026-03-24: Improved the Essay Coach starter-draft behavior. Added explicit generation modes (`fresh_angle` vs `build_on_my_draft`), converted current essay content to plain text before sending it to AI, and replaced the long post-generation explanation with one compact `coach_note` so the result is readable at a glance.
- 2026-03-24: Refined the Essay Coach result contract again so the popup no longer repeats the generated essay text. Starter drafts now return a concise summary, why the draft works, what admissions readers want to see, and clear next steps. Selected-text feedback now explains what changed, why it helps, and what reviewers are looking for.
- 2026-03-24: Made Essay Coach starter-draft controls more self-explanatory. `Fresh angle` now acts as a true idea/inspiration draft path with quick focus and tone settings, while `Build on my draft` now lets the student choose what to improve plus an optional context note. The primary CTA now changes with the selected mode instead of using one generic starter-draft button.
- 2026-03-24: Tightened the starter-draft prompt so `context_note` is treated as a required steering signal rather than a soft hint. Essay AI is now explicitly instructed not to invent a brand-new central story for `build_on_my_draft` unless it already exists in the user draft or context note.
- 2026-03-25: Added the first Community MVP as a new workspace surface. Backend now includes a dedicated `community` app with curated groups, memberships, structured posts, flat comments, saved posts, report flow, and rate-limited posting/commenting. Frontend now has a personalized Community hub, group detail pages, post composer, save/report actions, and Community navigation integrated into the shared shell.
- 2026-03-26: Added a subtle shared nav transition in the app shell. Workspace navigation now uses a short fade/translate transition before route changes, respects reduced-motion settings, and visually highlights the clicked destination without introducing heavy animation or extra loaders.

