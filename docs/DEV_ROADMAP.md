# Development Roadmap

## Product goal

Ship Enroll as a usable admissions operating system for students applying to U.S. universities.

Core promise:
- no chaos
- clear next steps
- deadlines, documents, essays, and profile data in one workflow

## Phase 1: Funnel and activation

Status: mostly done

Delivered:
- public landing page
- intro quiz before signup
- login / register flow
- dashboard entry after auth
- privacy policy baseline

Remaining improvements:
- add privacy links to login/register
- improve intro quiz polish and character system
- optionally push quiz answers into the user profile after auth

## Phase 2: Common App profile system

Status: in progress

Delivered:
- backend Common App progress engine
- section / subsection completion
- conditional visibility and required-state logic
- persistent restore after refresh
- substantial coverage for Profile, Family, and Education

Remaining:
- finish Testing details
- finish Activities details
- finish Writing details
- complete Future Plans polish
- unify all step UX and validation patterns

This is the highest-priority product block right now.

## Phase 3: Dashboard as operating center

Status: partially done

Delivered:
- dashboard shell
- early readiness visibility
- shared workspace shell

Remaining:
- real readiness score
- next-action logic
- connection to deadlines, essays, tasks, and universities
- stronger summary widgets users can act on immediately

## Phase 4: Universities and deadlines

Status: usable baseline done

Delivered:
- universities list and detail pages
- richer data cards
- deadlines ingestion and display
- enrichment structure behind the UI

Remaining:
- more product-quality filtering and sorting
- tighter shortlist/application linkage
- final detail-page polish

## Phase 5: Essays

Status: MVP baseline done, advanced features still open

Delivered:
- essay manager
- essay workspace
- version system
- rich text editor
- autosave
- compare API baseline

Remaining:
- AI mentor actions
- score system
- deeper compare UX
- university/prompt/deadline integration

## Phase 6: Production hardening

Status: not done

Must include:
- backend and frontend critical-path tests
- error tracking
- deployment checklist
- backup and recovery plan
- cookie/privacy/legal consistency
- performance review of heavy screens

## Current recommendation

Do not branch into large new product modules now.

The correct execution order is:
1. finish Common App
2. strengthen Dashboard
3. complete Essays loop
4. harden for production
