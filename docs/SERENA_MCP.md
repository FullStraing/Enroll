# Serena MCP in Enroll

This repository includes project-level MCP config in `.mcp.json`.
Serena is also registered globally for Codex in `C:\Users\user\.codex\config.toml`.

## Prerequisites

- Install Python 3.12+.
- Install `uv` (`python -m pip install --user uv`).
- MCP-capable client (Codex/Cursor/Claude Desktop compatible with `.mcp.json`).

## Server config used by this project

- Server name: `serena`
- Launch command: `python -m uv tool run --from git+https://github.com/oraios/serena serena-mcp-server --context codex --project-from-cwd`

## Session start protocol

Run this at the beginning of each development session:

1. Start Codex in the target repository.
2. Run `powershell -ExecutionPolicy Bypass -File .\scripts\session-start.ps1 -Log`.
3. Ensure `serena` is available in the client for the new session.
4. Continue work only after Serena is visible.

## Notes

- Context is `codex` to align Serena behavior with this coding workflow.
- `--project-from-cwd` keeps activation bound to the current repository.
- Codex reads MCP servers from `~/.codex/config.toml`, so new sessions may require a client restart after config changes.
