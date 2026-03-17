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
