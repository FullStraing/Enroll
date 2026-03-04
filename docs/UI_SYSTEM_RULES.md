# UI System Rules (Enroll)

## 1. Design source of truth
- All UI must follow Enroll design tokens only.
- No direct visual borrowing from GradGPT, Niche, or Peterson.
- No mixed styles on one page.

## 2. Tokens
- Define and use shared tokens only (colors, radius, border, shadows, spacing, timing).
- Avoid hardcoded random colors in page components.

## 3. Components first
- Reuse internal UI components from `frontend/components/ui/*`.
- Required base components:
  - Loader (sm/md/lg)
  - Progress
  - Skeleton (card/list/table)
  - Badge/Chip
- Do not copy raw external component code into pages without adaptation.

## 4. Loading behavior
- Full-screen loader: only auth/session gate or app bootstrap.
- Section/card data loading: skeleton only.
- Button actions: inline spinner + disabled state.
- Avoid loader flicker: show after 250ms, keep minimum 300ms.

## 5. Performance
- Prefer server-side filtering and pagination for large lists.
- Use debounced search for text input.
- Avoid unnecessary parallel requests.
- Avoid heavy animations and layout thrashing.

## 6. Motion
- Subtle motion only (fade/translate/hover lift).
- Respect `prefers-reduced-motion`.
- No decorative animation that hurts responsiveness.

## 7. Typography and language
- Primary UI language: Russian.
- Keep copy concise and readable.
- Keep naming consistent across pages.

## 8. Data integrity in UI
- If value is missing or unreliable, show `N/A`.
- Never invent computed values unless explicitly approved by rule.
- Keep official university website link visible where relevant.

## 9. Source branding
- No external provider watermark in user-facing cards.
- Source attribution only where legally required and in a dedicated area.

## 10. Done criteria for UI tasks
- Lint passes.
- No runtime errors.
- Mobile and desktop checked.
- Style is consistent with Home Page system.
