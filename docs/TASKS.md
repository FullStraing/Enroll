# Tasks

## Current status

The project is past the skeleton phase. The current state is:
- working Next.js frontend with live auth flow
- Django/DRF backend used as the main API layer
- PostgreSQL as the main database
- Common App draft flow partially implemented
- essay workspace implemented as MVP baseline
- universities and deadlines flow implemented as a real product module

## Done

### Product foundation
- domain-based Django backend apps: `users`, `universities`, `tasks`, `documents`, `essays`, `ai`, `core`
- JWT auth, registration, profile, password change
- settings page with account actions
- privacy policy page and legal links in core UI surfaces
- documents now work as a simple admissions file vault with upload/delete/download and document grouping
- documents support drag-and-drop upload, rename, per-file size limits, and an overall user storage cap

### Frontend foundation
- Next.js frontend established as the primary UI layer
- shared app shell and protected page pattern
- shared UI system and reusable components for design decisions
- unified visual system governed by `docs/UI_SYSTEM_RULES.md`
- dashboard visual redesign baseline with admissions profile, score, readiness, next step, universities, essays, and deadline blocks

### Funnel and activation
- public landing page
- intro quiz before signup/login
- quiz progress saved locally
- "do not show again" logic after quiz completion
- landing CTA routes to quiz or dashboard depending on known state

### Universities and planning
- universities list and detail views
- pagination and search structure
- richer admissions/cost/housing cards
- Peterson enrichment now includes `application_fee` extraction and full `Financial Aid` rows as normalized metric payloads
- deadlines ingestion and display
- applications flow baseline
- calendar page and task-oriented planning surface
- direct add/remove university actions from cards into user profile (`my-universities`) with immediate dashboard reflection

### Essays baseline
- essay manager
- create essay flow
- essay workspace
- versions list
- latest-version edit rules
- rich text editor
- autosave with retry protection
- compare endpoint and baseline compare UI
- first-visit essay onboarding modal

### Common App progress system
- backend progress API
- per-section and per-subsection completion computation
- persistent current-step restore after refresh
- dynamic conditional fields and repeated grouped blocks
- significant coverage for:
  - Profile
  - Family
  - large parts of Education
  - Testing baseline
  - Activities baseline
  - Writing baseline
- backend Common App logic largely moved out of monolithic `users/views.py`

## In progress

### 1. Common App completion
Still needs final parity and polish for:
- remaining testing detail flows
- remaining activities detail flows
- remaining writing detail flows
- future plans polish
- remaining conditional logic review
- final UX consistency across all subsections

### 2. Dashboard as command center
Needs stronger product logic:
- completed: clearer readiness summary and next-step card tied to profile/deadlines/essays
- completed: admissions profile snapshot with share action
- remaining: stronger ranking logic and recommendation quality
- remaining: tighter linkage to Common App completion edge cases

### 3. Essays phase continuation
Still open:
- AI Mentor actions that create new versions
- essay score
- richer diff UX
- tighter university/prompt/deadline linkage

### 4. Production readiness
Still open:
- observability and error tracking
- stronger tests for critical flows
- deployment and recovery runbooks
- cookie/privacy/legal completeness beyond the current baseline
- performance pass on large interactive screens

## Next recommended order

1. Finish Common App parity
2. Upgrade Dashboard into a real application control center
3. Complete the Essays product loop
4. Harden for production

## Immediate next tasks

- finish the remaining Common App sections so the flow is coherent end-to-end
- connect dashboard widgets to real completion state and next actions
- add legal links to login/register for full consistency
- continue file-size and modularity cleanup where oversized files remain
- normalize any remaining corrupted Russian strings in backend responses or older UI surfaces

## Explicitly not the priority right now

- another frontend rewrite
- another backend framework change
- speculative new modules before Common App / Dashboard / Essays are complete
- expanding product scope before the current workflow is finished and hardened
