# Tasks

## Current state

The project is beyond MVP skeleton stage.

What is real and working now:

- live marketing site
- intro quiz and auth flow
- dashboard
- universities
- tasks/calendar
- documents
- essays baseline
- Common App baseline
- community baseline
- settings

What was also added recently:

- global RU / EN localization foundation
- global light / dark theme
- dashboard snapshot/share redesign
- marketing refresh
- security hardening for beta

## Done

### Product foundation

- domain-based Django apps
- JWT auth, registration, Google auth, profile, password change
- settings page
- legal pages
- shared app shell
- protected page pattern
- shared UI token system

### Marketing and funnel

- landing `/`
- product page `/product`
- pricing page `/pricing`
- pilot page `/pilot`
- intro quiz before signup
- CTA routing based on auth/session state

### Dashboard

- admissions overview shell
- snapshot/export/share flow
- admissions score donut
- edit-profile integration
- next-step / readiness surfaces baseline

### Universities and planning

- universities list
- university detail
- my-universities table
- deadlines ingestion/display
- applications baseline
- tasks/calendar planning flow

### Documents

- upload / rename / delete / download
- document typing
- optional university link
- production-safe object storage support

### Essays

- essay manager
- essay workspace
- versions
- autosave
- compare baseline

### Common App

- backend progress engine
- section/subsection completion
- conditional visibility
- persistent resume state
- major baseline coverage across Profile / Family / Education / Testing / Activities / Writing

### Security hardening

- identity linkage for auth
- password validation
- throttling
- shorter JWT lifetime
- upload allowlist
- AI log redaction
- active-only university exposure
- safer community payloads

### Theme and localization

- shared RU / EN switcher
- shared light / dark theme
- shell + marketing + dashboard + intro quiz + documents + universities + settings + community localized/theme-aware to a meaningful degree

## In progress

### 1. Plan gating / billing readiness

Current state:

- real backend subscription / entitlement model exists
- server-side free vs paid limits are enforced
- restricted preview matrix exists for free users

Current free preview defaults:

- `my universities`: `2`
- `discover universities`: `6`
- `essays`: `1`
- `essay versions per essay`: `5`
- `AI requests / month`: `10`

Still not solved:

- production billing / payment provider integration
- pricing-to-plan purchase flow
- billing-state sync into the existing plan model

### 2. Common App completion

Still needs:

- remaining detail flows
- full parity and consistency
- final UX cleanup

### 3. Essays advanced loop

Still needs:

- stronger AI actions
- better compare/review loop
- tighter university context

### 4. Full localization cleanup

Still open:

- some deeper screens remain partially untranslated
- older copy files still contain mojibake
- marketing copy source needs one final UTF-8 cleanup pass

### 5. Production discipline

Still open:

- clearer "pushed vs deployed" discipline
- final visual QA before each deploy
- more explicit rollout checklist for frontend-only releases

### 6. Dashboard snapshot polish

Still open:

- donut hover tooltip should not shift card layout
- snapshot interactions need final no-jump overlay treatment

## Next recommended order

1. implement production billing on top of the existing account-plan / entitlement model
2. continue polishing limit-state UX around the enforced free preview
3. finish Common App parity
4. finish essays advanced loop
5. complete UTF-8/localization cleanup
6. finish dashboard snapshot tooltip stability

## Immediate next tasks

- connect a payment provider to the existing plan model
- keep blocked premium-only actions behind explicit backend errors and clean UX
- continue surfacing upgrade/limit states across universities, essays, and AI
- audit docs/copy so plan limits stay aligned with the real backend configuration
- clean remaining mojibake in `landing-content.ts`, `i18n.ts`, and older strings
- move dashboard donut tooltip into an absolute/fixed overlay so hover does not reflow the snapshot

## Explicitly not the priority right now

- new large modules
- framework rewrites
- speculative product expansion before billing integration and core workflow completion
