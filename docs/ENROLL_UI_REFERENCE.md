# Enroll UI Reference

## Status

This file is archival only.

It is not the active source of truth for current Enroll UI work.

## What is current

Use these documents for actual product decisions:

- `docs/UI_SYSTEM_RULES.md` for all UI and interaction rules
- `README.md` for current product scope and route map
- `docs/TASKS.md` and `docs/DEV_ROADMAP.md` for current implementation priority

## Why this file is limited

An older version of this document contained external visual-reference guidance for the landing page.
That no longer matches the project's current rules.

Current Enroll policy is:

- no direct visual borrowing from external products
- one internal UI system as the source of truth
- implementation should follow the existing Enroll patterns already present in the codebase

## Practical guidance

When updating UI:

1. Start from the existing page and shared components.
2. Reuse `frontend/components/ui/*` where possible.
3. Keep Russian as the primary UI language where the product already uses it.
4. Preserve consistency with the current Enroll design system instead of introducing a new visual direction.
