# Development Roadmap

## Product goal

Ship Enroll as a production-usable admissions operating system for students applying abroad.

Core promise:

- no chaos
- one visible next step
- shortlist, deadlines, essays, documents, and profile in one workflow

## Phase 1: Funnel and activation

Status: delivered

Delivered:

- landing
- product page
- pricing page
- pilot page
- intro quiz before auth
- login / register / Google auth
- session-aware CTA routing

Remaining polish:

- final marketing copy cleanup
- deploy discipline and visual QA before release pushes

## Phase 2: Workspace baseline

Status: delivered baseline

Delivered:

- dashboard
- universities
- tasks/calendar
- documents
- essays baseline
- settings
- community baseline

Remaining:

- tighter cross-module orchestration
- cleaner empty-state / premium-limit UX

## Phase 3: Common App completion

Status: still in progress

Needed:

- finish the remaining sections and detail flows
- make UX consistent end-to-end
- remove edge-case inconsistency

This remains one of the highest product priorities.

## Phase 4: Essays depth

Status: baseline done, advanced loop not done

Needed:

- stronger AI actions
- scoring/review depth
- better compare workflow
- tighter linkage to universities and deadlines

## Phase 5: Monetization / plan gating

Status: not implemented yet

Needed:

- account-plan source of truth
- free vs paid feature matrix
- backend enforcement
- frontend upgrade/limit states
- explicit university limit for free accounts

This is now the most important business/product infrastructure gap.

## Phase 6: Localization and copy integrity

Status: partially done

Delivered:

- RU / EN shared system
- major shell/marketing/workspace coverage

Still needed:

- deep-screen completion
- cleanup of remaining mojibake
- make all visible user copy UTF-8 clean

## Phase 7: UX and release polish

Status: still active

Needed:

- dashboard snapshot tooltip without layout shift
- final dark-mode consistency pass on remaining deep screens
- smaller and safer frontend release batches
- explicit pushed-vs-deployed tracking before every release

## Phase 8: Production hardening

Status: partially done

Delivered:

- major auth/security hardening
- throttling
- upload restrictions
- safer production topology
- dark-mode/theme system

Still needed:

- stronger quotas
- final entitlement enforcement
- better release discipline
- more complete observability / recovery docs

## Current recommendation

The correct order now is:

1. implement plan/entitlement model
2. enforce free-account university limit
3. complete Common App
4. complete essays advanced loop
5. finish localization/copy cleanup
6. finish dashboard snapshot/release polish
7. deploy in smaller, deliberate batches
