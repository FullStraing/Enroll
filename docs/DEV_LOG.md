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
- 2026-03-26: Upgraded the shared app nav to use one moving active indicator instead of a static active fill. The highlighted nav pill now slides between destinations at a moderate speed, including nested routes like community groups and essay detail pages, while keeping the rest of the shell motion subtle.
- 2026-03-26: Removed the page-level shell fade/blur during navigation and kept only the nav indicator animation. This fixes the visible whole-page flash after route changes while preserving the smoother moving highlight between nav items.
- 2026-03-26: Reverted the shell navigation back to the first transition style on request. The page-level fade/blur is restored, and nav items again use the earlier per-button active and pressed-state styling instead of the moving shared indicator.
- 2026-03-26: Reworked Community from a multi-section social hub into a simple Applicants Chat MVP. The main Community page is now one live chat surface with a small set of curated rooms, a pinned intro prompt, quick topic tags, and a bottom composer for sending short admissions-focused messages.
- 2026-03-26: Started a shared visual cleanup pass for nested workspace surfaces. Added softer `surface-card` / `surface-panel` tokens, switched the default `Card` to the softer style, and applied the new balance first to Universities and Tasks so the outer shell remains bold while inner sections use lighter borders and shallower shadows.
- 2026-03-26: Added a lightweight completion animation to task rows. Marking a task as done now plays the new checkbox Lottie in-place, gives the title/meta a short success motion, respects reduced-motion preferences, and only then moves the item into `Completed`.
- 2026-03-26: Stabilized the Tasks completion flow. Calendar cache now waits for real hydration before persisting, so empty task state no longer overwrites real data on navigation. Completion animation ownership moved up to the page so only one row can animate at a time, and the checkbox Lottie now renders larger and earlier so the completion confirmation is actually visible before the row moves into `Completed`.
- 2026-03-26: Finished the safe-now optimization pass around Tasks and shared session cache behavior. The task checkbox/animation slot was enlarged to match the normal bullet footprint, completion delay was shortened for a crisper transition, `Essays` now marks cached hydration before writing back to session storage, and `Common App` cache reads/writes are now explicitly token-scoped so multi-account use in one browser does not cross-pollute cached workspace state.
- 2026-03-26: Continued the safe optimization wave without changing product behavior. `Tasks` now uses one page-level cache persistence helper instead of repeated inline writes, `Dashboard` moved onto the shared user-scoped session cache path, and `Universities` now scopes session UI/cache state per user while throttling scroll-state writes with `requestAnimationFrame` to reduce main-thread churn.
- 2026-03-26: Moved profile editing out of the dashboard modal and into the `/onboarding` workspace as a full `Edit Profile` page. The dashboard `Edit profile` action now routes directly to that page, the old popup-only state and autosave logic were removed from `Dashboard`, the sidebar label was renamed to `Edit Profile`, and the shared profile editor gained a page-mode header/copy so it reads like a proper workspace instead of a modal.
- 2026-03-26: Converted the new `Edit Profile` page into a step-by-step flow instead of one long linear scroll. Page mode now shows one section at a time with `Back` / `Continue`, starts on `Basic Info` by default, keeps autosave behavior intact, removes duplicate explanatory copy at the top, and softens the page-mode borders so the editor no longer looks like heavily nested boxes.
- 2026-03-26: Reduced the remaining layering in `Edit Profile` page mode. The page-mode shell no longer adds its own heavy outer frame, the repeated colored section headers are suppressed inside the wizard view, the success hint is now an inline line instead of another boxed surface, and the step actions/footer were flattened so the page reads as one workspace instead of stacked nested cards.
- 2026-03-26: Started the production launch hardening pass. Django settings now support real production env configuration instead of dev-only defaults: env-driven `DEBUG`/`SECRET_KEY`/`ALLOWED_HOSTS`, explicit CORS and CSRF trusted origins, HTTPS/cookie security controls, WhiteNoise static handling, optional S3-compatible media storage, structured console logging, and optional Sentry wiring. `/api/ping/` now reports environment, database, cache, and storage backend so production health checks are actually meaningful.
- 2026-03-26: Added public launch prerequisites for Paddle/site verification: new `/pricing`, `/terms`, and `/refund-policy` routes, a shared legal page shell, and landing-page legal/pricing links. Also added launch scaffolding in the repo via `.env.example`, a `Procfile`, a basic GitHub Actions CI workflow, and `docs/PRODUCTION_LAUNCH.md` documenting the Vercel + Railway/Render split deployment path.
- 2026-03-26: Tightened production-facing auth and routing details on the frontend. Token mirror cookies now become `Secure` automatically under HTTPS, and middleware protection was expanded to cover `universities`, `activities`, and `community` routes so the deployed workspace does not leave gaps between app shell auth and page-level auth checks.
- 2026-03-26: Added production safety switches across backend and frontend. Runtime flags now cover AI, uploads, community posting, registration, Google auth, and maintenance mode; `/api/ping/` exposes them for ops; and the app now degrades cleanly with read-only or disabled UX instead of leaving live controls that would only fail on submit.
- 2026-03-26: Closed a launch-safety auth gap by making Google auth respect `REGISTRATION_ENABLED` for new-user creation. Existing Google users can still sign in when registration is closed, but OAuth can no longer be used to silently bypass a signup freeze during soft launch or abuse mitigation.
- 2026-03-26: Expanded the launch runbook and env template with operator kill switches, file-storage/secret-handling guidance, and first-response procedures. Verified the full release candidate with `npm run lint`, `npm run build`, `python manage.py check`, and production-like `python manage.py check --deploy` (leaving only the intentional HSTS preload warning).
- 2026-03-26: Clarified the root `.env` deployment workflow. The launch docs and README now explicitly treat the repo-root `.env` as local-only, explain that backend/frontend already read it locally, and document how the same values should be split into Vercel vs Railway/Render env panels during production rollout.
- 2026-03-26: Added a deterministic container deploy path for Railway. The repo now includes a root `Dockerfile` and `.dockerignore` so the backend can be built from the monorepo root without Railway trying to auto-infer both the Django backend and Next.js frontend from one tree.
- 2026-03-26: Hardened the Railway container start path further by making the backend run `python manage.py migrate --noinput` before Gunicorn. This keeps first deploys and later schema changes safer during soft launch, since the live service no longer depends on a separate manual migration step to boot against the current database schema.
- 2026-03-26: Brought up the first real soft-launch hosting path: Railway now runs `backend-api`, `postgres-db`, and `redis-cache`, while Vercel serves the `frontend/` app. Verified the live backend `/api/ping/` on Railway, wired the production frontend to the Railway API via Vercel env vars, and intentionally kept `FILE_UPLOADS_ENABLED=0` until object storage is attached so public document uploads cannot hit ephemeral disk.
- 2026-03-26: Added an extra production storage guardrail: even if someone accidentally sets `FILE_UPLOADS_ENABLED=1`, the backend now still keeps document writes disabled unless S3-compatible storage is actually configured. `/api/ping/` now exposes storage write status and the disable reason, and the launch runbook includes Cloudflare R2 example values.
- 2026-03-26: Enabled Cloudflare R2 for the live Railway backend. Production storage now reports `backend = s3` with writes enabled, so document uploads no longer depend on Railway's ephemeral filesystem.
- 2026-03-26: Ran live production smoke tests against the Railway backend after R2 enablement. Verified `register -> token login` succeeds and a real multipart document upload persists with a non-empty `download_url`, confirming the document flow now writes through Cloudflare R2 in production.
- 2026-03-26: Rotated the live Cloudflare R2 credentials by updating Railway from the refreshed root `.env` values, then verified a new production upload still succeeds with a non-empty `download_url`.
- 2026-03-26: Updated the Railway backend to use the refreshed Gemini API key from the root `.env` and verified it against the live essay starter-draft endpoint. Production Essay AI returned `200` with a new AI version and structured summary fields, confirming the new key works.
- 2026-03-26: Verified the actual deploy mode instead of assuming automation. Railway clearly remains a controlled/manual deploy (`source.repo = null`), and the current Vercel project metadata shows a linked project but no explicit Git repository details in CLI inspect output, so both surfaces should be treated as manual/controlled deploys until Git auto-deploy is deliberately configured later.
- 2026-03-28: Started beta-launch stabilization. Added a new `analytics` backend app with tracked product events (`signup_started`, `signup_completed`, `onboarding_completed`, `first_task_created`, `first_university_added`, `first_essay_started`), a staff-only summary endpoint, frontend tracking helpers, and a small analytics panel in Settings for beta review. Also switched post-auth routing toward `Edit Profile` first by exposing `onboarding_completed` on the auth/profile surface and resolving login/register/intro-quiz redirects from live profile truth.
- 2026-03-28: Hardened early beta flows. Tasks now guard against stale background workspace loads overwriting fresh local mutations after add/toggle, protected pages redirect incomplete users back to `/onboarding`, Community chat uses request-id guards to avoid stale room/message loads, and two real backend prod bugs were fixed during verification: missing `settings` import in Community posting and a redundant serializer source declaration breaking generated task responses. Relevant frontend checks (`npm run lint`, `npm run build`) and backend tests (`apps.analytics`, `apps.users`, `apps.tasks`, `apps.community`) all pass under SQLite.
- 2026-03-28: Prepared the first beta-launch stabilization deploy. This block includes the new minimal analytics funnel, stronger onboarding-first routing, stale-response guards in Tasks and Community, and backend fixes for Community posting plus generated task serialization. Next step is live smoke testing on production after push/deploy to verify `Tasks`, `Community`, analytics event capture, and incomplete-profile routing behavior against the real Vercel + Railway environment.
- 2026-03-28: Deployed the beta-launch stabilization block to both production surfaces (`frontend` on Vercel and `backend-api` on Railway). Live smoke tests against the Railway API confirmed: `/api/ping/` healthy with `database=ok` and `storage=s3`, anonymous `signup_started` event recording returns `201`, a new user can register/login successfully, that new user's profile reports `onboarding_completed = False`, task creation persists, community room listing loads, room join succeeds, and posting a chat message succeeds in the seeded Central Asia room.

