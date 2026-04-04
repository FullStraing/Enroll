# Dev Log

Lightweight session log for preserving short-term context across development sessions.

- 2026-04-03: Rebuilt the marketing layer into a cleaner `Home + Product` structure. The home page now focuses on a concise hero, comparison rows, six-module overview, process timeline, trust block, and final CTA, while a new `/product` page carries the deeper product explanation. Also removed the mojibake-heavy landing copy and aligned public navigation/CTA routing around `Продукт`, `Тарифы`, intro-quiz entry for new users, and dashboard entry for authenticated users.
- 2026-04-03: Restyled the home page only with a Grotesk-driven marketing layer. The landing header now uses a more minimal custom Enroll lockup, the dotted background is visible again behind the main shell, and the hero copy was tightened from a vague calming message to a clearer `Поступление в США без хаоса` value statement.
- 2026-04-03: Tightened the landing typography again after visual review. Home now uses `Inter` for body copy and a `Space Grotesk`-led display stack for the wordmark and major headings, the top-left brand lockup is now a clean text-only `Enroll` wordmark closer to the reference, and the hero headline was clarified further to `Вся подача в США в одной системе`.
- 2026-04-03: Corrected the landing typography after Russian copy started reading too large and uneven. Home now uses `Inter` consistently for Russian headings/body, the hero is significantly tighter on desktop and mobile, CTA buttons stack cleanly on small screens, and the new text-only `Enroll` wordmark was propagated into the shared app shell and dashboard snapshot branding where it fits safely.
- 2026-04-03: Removed the extra framed box around the mobile/sidebar wordmark so the new `Enroll` brand reads cleanly without competing chrome. Also rebuilt the `pricing` and `product` pages into the same Russian-first marketing system as home: tighter hero sections, cleaner CTA layout, clearer product explanation, and a controlled-beta pricing message instead of the old generic launch placeholder copy.

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
- 2026-03-28: Relaxed the onboarding gate after live feedback. Incomplete users still land on `Edit Profile` first after auth, but they are no longer hard-redirected away from every protected page. Also improved remembered-login behavior by letting `/login` and `/register` immediately redirect authenticated users into the app and by falling back to the mirrored auth cookie when localStorage is missing the access token.
- 2026-03-28: Tightened the Tasks mutation race guard again after production feedback. The calendar workspace now invalidates in-flight loads immediately when add/toggle begins, persists cache from stable ref-backed application/university snapshots instead of recreating the cache writer on every dependency change, and deduplicates newly created tasks before inserting them into local state so the just-added row no longer blinks in and out until refresh.
- 2026-03-28: Refined the `Edit Profile` page-mode wizard for beta use. Activities, Honors, and Universities now expose their action controls in page mode instead of hiding them with the non-page section headers, the duplicate step/footer actions were merged into one shared footer, and Dashboard no longer hard-redirects incomplete users back to onboarding. Incomplete users now see a soft completion CTA on Dashboard while still being able to access the workspace.
- 2026-03-28: Restored the production universities catalog after confirming the live API was returning `count=0`. Seeded the Railway database with Peterson university records to bring the public catalog back online, and hardened the licensed-feed connector so mock ingestion works inside the production container even when `LICENSED_FEED_MOCK_PATH` is still set to the old repo-relative value.

## 2026-03-28
- Fixed production university profile degradation path in `frontend/app/universities/[id]/page.tsx` by making metrics/snapshot/deadlines fetches tolerant of partial failures instead of crashing the whole page on a missing snapshot.
- Expanded Peterson enrichment commands to target all active universities, including the currently licensed top schools, so production backfill can populate snapshots and deadlines across the full catalog.
- Deployed the university enrichment coverage fix, then ran live Railway backfills:
  - `scrape_peterson_universities --limit 200`
  - `ingest_university_deadlines --limit 200 --source petersons`
  - targeted Peterson/deadline enrichment for `Harvard`, `Stanford`, `MIT`, `NYU`, and `University of Michigan - Ann Arbor`
- Verified on production API:
  - `Abilene Christian University`: snapshot present, `29` metrics, `4` deadlines
  - `Harvard/Stanford/MIT/NYU/Michigan`: snapshots present, `31-33` metrics each, `3` deadlines each
- Seeded one example university for newly created users at registration / Google sign-in on the backend, without firing the real `first_university_added` analytics event.
- Redesigned the Dashboard Snapshot score column so `Honors` is no longer visually nested under `Admissions Score`. The right side now uses two separate stacked surfaces: a score card with a visible segmented breakdown (`Profile readiness`, `Academics`, `Tests`, `Planning`) and a compact honors card capped to four visible items plus `+N more`.
- Added `buildAdmissionsScoreBreakdown()` in dashboard utils, keeping the existing score formula intact while exposing segment weights, raw completion, weighted contribution, status, and color for the snapshot UI.
- Extended `CircularProgress` with a backward-compatible segmented SVG mode so the same component can still render the simple ring elsewhere while the dashboard snapshot/export now shows weighted score segments directly in the circle.
- Tightened the new segmented admissions ring after visual review: removed artificial gaps between segments, dropped the static breakdown list under the chart, and made each score segment interactive so hovering/focusing a section highlights it and shows a compact inline explanation without increasing snapshot height.
- Replaced the dashboard snapshot's experimental custom SVG ring with a dedicated `recharts` donut component. The admissions chart now starts at the top, renders dense segments without visible gaps, keeps the center total score, and shows one compact inline callout for the hovered/clicked score section instead of the previous list-style breakdown.
- Corrected the donut semantics after live review: the chart now renders each score section as a colored filled slice plus a gray unfilled remainder inside the same weighted segment, so the ring no longer looks like `100%` when the total admissions score is lower. Also reduced the outer radius to stop visual clipping at the card edge.
- Simplified the Admissions Score card again for clarity. Instead of a segmented ring with ambiguous gray slices, the snapshot now uses one honest total-score donut (`filled` vs `remaining`) plus four compact category rows underneath, each with its own color marker, percentage, and mini progress bar so users can see the overall score and where they are lacking within two seconds.
- Reworked the Admissions Score chart one more time to make the logic explicit directly in the ring. The chart is now divided into exactly four weighted sectors, and each sector contains its own colored progress plus its own gray remainder. This removes the misleading “fifth gray category” effect while keeping the overall total score in the center and moving all explanation into per-sector hover/click tooltips.
- Refined the admissions ring into a cleaner earned-vs-missing model after another UX pass. Colored score contributions are now grouped together as the earned portion of the donut, while one continuous gray segment represents the total missing gap. Hovering colored slices explains the exact category contribution; hovering the gray slice shows a grouped summary of what is still missing by category.
- Removed layout shift from the Admissions Score hover details. The score chart now reserves its tooltip space inside the same card and anchors the explanation panel as an internal overlay, so hovering or tapping sectors no longer pushes `Honors` or the rest of the snapshot downward. This also keeps the interaction stable on phone-sized layouts.
- Fixed the dashboard share-preview flow for production browsers that block image clipboard writes. The preview toast is now shown immediately after the snapshot blob is rendered, and clipboard failure falls back to download without suppressing the preview UI.
- Made the dashboard snapshot chart deterministic for export by disabling Recharts sector animation in the Admissions Score donut, which avoids partial white wedges appearing in copied/saved images. Also restored a more visible success feedback for `Copy image` by adding an animated Lottie check flourish back into the share preview toast while keeping the production-safe plain `img` preview.
- Separated the live and export donut render paths for Dashboard Snapshot sharing. The live card still uses the interactive `recharts` donut with hover tooltips, while the hidden export card now uses a deterministic `conic-gradient` ring so copied/saved images no longer pick up transient white SVG artifacts. Also moved the share preview toast into a top-level portal and increased its visibility window, making the animated `Copy image` feedback reliably visible on production and on mobile.
- Redesigned the University Card deadlines section into a scan-first admissions layout. Deadline types are now mapped to human-readable names, cards are sorted as upcoming fixed -> rolling -> passed, the nearest fixed date is highlighted as the next important deadline, rolling rounds get dedicated copy instead of fake dates, and passed deadlines are visually separated into a muted group so notify dates no longer compete with the main application deadline.
- Repaired missing production university profile data on Railway by rerunning the Peterson enrichment and deadline ingestion across the full 200-university live catalog. This specifically targets the data blocks the University Card depends on for `Can I afford it?`, gender admissions, `Important factors of admission`, `Campus diversity`, and enriched deadline rows, so production is no longer limited to the small set of previously backfilled flagship schools.
- Reworked the `Edit table` control on the Universities page into a collision-aware fixed popover rendered through a portal. The settings panel now tracks the trigger during scroll/resize, avoids forcing the whole page to scroll, uses a wider compact layout, and splits the visible-column toggles into a denser two-column grid so the popover stays usable on both desktop and smaller screens.
- Started the first concrete security-hardening pass before beta. Added a dedicated `UserAuthIdentity` layer with normalized unique email ownership plus optional `google_sub`, made password registration require normalized unique email + Django password validation, and changed Google sign-in to resolve by linked identity instead of blindly logging into the first `User.email` match.
- Added rate limiting to the highest-risk public-ish endpoints: token obtain, token refresh, password registration, Google auth, analytics event intake, document uploads, and community reports. Also reduced JWT lifetimes from `30d/90d` to `12h/14d` and disabled `send_default_pii` in backend Sentry config.
- Hardened document uploads for beta by restricting accepted file types to a small allowlist (`pdf`, `png`, `jpg`, `jpeg`, `doc`, `docx`) instead of allowing arbitrary files under the existing size cap.
- Reduced privacy/data-exposure risk in the Community and Universities surfaces. Community author payloads now default to pseudonymous display names with empty country/major/intake fields, and user-facing university detail/metrics/deadline/add-to-list paths now require `is_active=True`.
- Minimized AI interaction logs so they store redacted metadata instead of full prompt/response bodies, lowering the blast radius if DB/admin/debug access is ever misused. Also updated frontend auth bootstrap cookies so the browser-visible cookie is now only a session marker (`enroll_session`) instead of duplicating the raw access token.
- Ran live production security smoke checks after deploy: real password signup/login succeeded against Railway, PDF upload succeeded with a live `download_url`, and an `.html` upload was rejected with the new allowlist validation.
- Fixed the landing auth mismatch for already signed-in users. The frontend now self-heals the `enroll_session` marker cookie from a valid locally stored access token, so middleware no longer bounces old sessions to `/login`, and both the header and main landing CTAs now route authenticated users to `/dashboard` instead of restarting the intro quiz.
- Refined unauthenticated/authenticated entry UX: login and registration now include a direct `На главную` path, and the landing header now swaps the old static `Войти` button for an account pill when an authenticated session is already present, while keeping the main `Начать` CTA visible.
- Rebuilt the marketing content source into clean UTF-8 `landing-content.ts` data after prior landing/pricing/product copy had drifted into mojibake. Home now includes a Radix/shadcn FAQ accordion, product/pricing both use the shared minimal text-only `Enroll` wordmark in the header, and pricing now presents the real placeholder offer cleanly as `$40 / 6 months` with the derived `≈ $6.67 / month` framing instead of the old “pricing after beta” message.
- Removed the home page's local body-font override so landing content now inherits the same app-wide typography as the rest of the product again, while keeping the shared `Enroll` wordmark unchanged.
- Restored the shared dotted background on marketing pages by making /pricing and /product use transparent page backgrounds like home, so the global body texture shows consistently behind the main shell again.
- Added an explicit `Главная` link to the shared marketing header so users can jump back to `/` from the same top navigation used on home, product, and pricing.
- Rebuilt `/pricing` into a clearer two-plan structure: `Free` and `Pro` now sit side by side, `Pilot` moved into its own secondary access block, and the paid offer now uses a client-side billing toggle for `Monthly / 6 months / Annual` with grounded savings copy (`$9`, `$42`, `$72`) instead of treating all plans as equal self-serve options.
- Compacted `/pricing` again after design review: removed `Free` as a full comparison card, turned free access into a short inline note, tightened the main `Pro` offer into one shorter primary card with cleaner Russian copy, and kept `Pilot` as a separate secondary access block below.
- Restructured `/pricing` once more to match a clearer plan-table layout: the billing toggle now sits centered above the plans, `Pro` and `Pilot` use parallel card structure with shorter copy and tighter spacing, and free access stays as a compact note below instead of acting like a full pricing column.
- Reworked `/pricing` again to mirror a cleaner top-toggle pricing table: restored three aligned cards (`Free`, `Pro`, `Premium`), moved monthly/annual switching into a dedicated toggle above the grid, changed price presentation to marketing-style `.99` values, and added explicit annual savings badges so the page now reads much closer to the chosen visual reference.
- Added a shared marketing-only route transition layer through `frontend/app/template.tsx` and a new `marketing-route-transition` client wrapper. Navigating between `/`, `/product`, `/pricing`, and `/pilot` now uses a short Enroll-style fade/slide reveal plus a dotted overlay with a compact `Enroll` badge, making landing-page navigation feel intentional instead of abrupt.
- Refined the marketing transitions and landing alignment after visual review: removed the temporary `Enroll` badge from the page transition overlay so it no longer reads like a bug, kept only a short dotted fade layer, fixed the highlighted pricing card to use a clean full-width yellow top strip with proper clipping, and vertically aligned the right-hand comparison blocks on home so both halves now sit on the same baseline.
- Refined the in-app sidebar chrome: increased and aligned the shared `Enroll` wordmark in both the mobile drawer header and expanded desktop sidebar, then replaced the old MVP-style `Landing` button with a more polished secondary `Главная` action that carries the same visual system as the rest of the shell.
- Added the first global RU/EN localization layer for the frontend through a persistent `enroll_locale` cookie, root `LocaleProvider`, and shared `LanguageSwitcher`, with the root `<html lang>` now following the selected locale.
- Rebuilt the shared copy layer into clean UTF-8 dictionaries instead of mojibake: `frontend/lib/i18n.ts` now owns common/auth/shell/pilot/pricing labels, and `frontend/app/landing-content.ts` now serves localized marketing content for both home and product pages.
- Localized the shared chrome surfaces that define most of the product feel: the marketing header/footer, landing auth actions, app shell sidebar/topbar, page-title/subtitle mapping inside `AppShell`, and the Google sign-in button now all react to the active locale.
- Localized the core entry pages that sit in the acquisition/auth funnel: `/login`, `/register`, `/pilot`, `/`, `/product`, and `/pricing` now switch between Russian and English without relying on duplicated page files.
- Kept the rollout pragmatic instead of rewriting the whole app at once: this pass covers the global shell and the major marketing/auth surfaces first, which gives users a real site-wide language switch today while leaving deeper page-specific content such as the full intro quiz for a later translation pass.
- Extended localization into the live dashboard/workspace layer. Added shared dashboard copy in `frontend/lib/dashboard-copy.ts`, localized snapshot/export UI, the admissions score donut, the share-preview toast, dashboard progress cards, dashboard status messages, and page-level widgets so the main admissions workspace no longer mixes English into RU mode.
- Localized the `Edit Profile` workspace/modal copy with the same dashboard dictionary: section labels, step controls, field labels, helper text, empty states, university snapshot selection labels, and autosave footer messaging now switch with the global RU/EN toggle.
- Updated `buildDashboardProgress()` and `buildAdmissionsScoreBreakdown()` to accept locale-aware copy so computed block titles, summaries, segment labels, and score hints are translated instead of being hardcoded English data.
- Localized the `intro-quiz` and `documents` flows through a shared `product-copy` layer. The intro quiz now switches all prompts, actions, summaries, and option sets with the active locale, while the documents workspace localizes upload, readiness, rename, empty/error, and file-management states end to end.
- Extended the second localization pass into the universities workspace. The main `/universities` page, discover filters, discover cards, my-universities table, status toasts, table settings popup, empty states, application-fee summary, and chance/category labels now read from the shared `product-copy` dictionary instead of mixing English strings into RU mode.
- Localized `Settings` into the shared RU/EN product dictionary. Profile, security, session, legal, and beta-analytics surfaces now switch with the global locale toggle, including save/password status messages and the staff analytics empty/loading states.
- Localized the main `Community` chat screen with the same product-copy layer: shell titles, runtime notices, room list chrome, pinned prompt, tag chips, composer placeholder/button, and room/message empty states now follow the active locale instead of leaving the whole collaboration surface in hardcoded English.
- Added the first production-ready dark-mode pass for the marketing/auth layer. The frontend now uses `next-themes` with CSS-variable-backed tokens, the shared marketing chrome and app shell expose a theme switcher, and the marketing routes (`/`, `/product`, `/pricing`, `/pilot`, `/login`, `/register`) are dark-theme aware without relying on generic inversion. Shared buttons, badges, auth actions, landing chrome, product shots, and pricing surfaces were updated to use the new token-based palette so contrast stays readable in both light and dark modes.
- Extended the dark-mode rollout into the deep workflow screens only, without touching the shared infra layer. Added a dedicated deep-workflow scope wrapper and themed the intro quiz, Common App, activities, calendar/tasks, and essays screens so their hardcoded light surfaces inherit the dark palette cleanly; also cleaned up common-app field inputs and section navigation so those controls stay readable in dark mode.
- Consolidated the global Enroll dark-theme rollout into one verified frontend block. Shared theme infrastructure (`next-themes`, root provider, CSS design tokens, ThemeSwitcher) is now live in the app layout, marketing shell, and `AppShell`, while dashboard, universities, documents, settings, community, intro-quiz, common-app, activities, calendar, and essays all received theme-aware surface updates. Verified the integrated workspace with `npm run lint` and `npm run build` after the combined pass.
- Tightened the first dark-mode bugfix pass after visual QA: removed the third `System` theme mode from the switcher, restored the task-completion writing animation in dark mode by moving its text/color effects onto theme tokens, fixed mojibake in the `My Universities` table RU labels/statuses, and added `min-w-0` / overflow guards to the app shell and universities page so the extra horizontal page scroll stops appearing from the table layout.
- Fixed the remaining RU mojibake in the main Community chat page. The broken hardcoded Russian empty-state strings in `frontend/app/community/page.tsx` were replaced with clean UTF-8 copy, and the page still passes `npm run lint` + `npm run build`.
