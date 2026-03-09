# Development History

## Initial direction

Enroll started as an admissions workflow product for students applying to U.S. universities. The initial goal was not automated submission. The goal was structured preparation:
- build a shortlist
- track deadlines
- manage documents
- organize essay drafts
- reduce process chaos

## Backend foundation

The first stable technical layer was Django + DRF with domain-separated apps:
- users
- universities
- tasks
- documents
- essays
- ai
- core

That established the main API and data model before the modern frontend was fully in place.

## Early UI phase

The project initially used Django-rendered pages and template-based screens to validate the flows quickly.

That phase proved:
- auth worked
- profile editing worked
- application / task / document flows were feasible

But it was not the long-term frontend direction.

## Frontend migration

The product then moved to a dedicated Next.js frontend.

That was the correct move because:
- UI iteration became faster
- interactive surfaces like calendar, Common App, and essays became much more realistic
- the frontend could evolve without rewriting backend logic

The migration was gradual. Django stayed as the backend API and admin layer. Next.js became the user-facing product UI.

## Universities and data expansion

The university module became one of the main product pillars:
- list views
- detail pages
- deadlines
- enrichment metrics
- source/snapshot logic for ingestion history

At that point, the product moved beyond a simple tracker and started behaving more like an admissions data platform.

## Essays expansion

Essays evolved from an idea into a working subsystem:
- essay manager
- versioned drafts
- rich text editing
- autosave
- compare support

The design goal became clear: essays should feel closer to a versioned workspace than a plain text field.

## Common App expansion

Common App then became the largest structured-data track in the product.

Major work done:
- progress endpoint
- dynamic field schema
- conditional visibility / requirements
- repeated grouped blocks
- persistence and resume behavior
- backend modularization of schema and progress logic

This is still the most important unfinished product area because it directly drives onboarding, readiness, and future application automation support.

## Intro quiz and activation

The project later added a pre-signup intro quiz inspired by Duolingo-style onboarding:
- the user answers a few short questions first
- the product shows value before forcing account creation
- repeat visitors can bypass the quiz and go directly into the workspace

This was a business decision as much as a UI decision. It improved the top-of-funnel structure.

## Current state

Today Enroll is no longer a prototype shell. It is a structured product with:
- working auth
- real Next.js frontend
- universities module
- calendar/tasks surface
- essays module
- Common App draft system
- dashboard/settings/legal surfaces

What remains is not invention from zero. It is completion, integration, and hardening.

## Current unfinished work

The major unfinished blocks are:
- Common App parity
- Dashboard intelligence
- advanced Essays features
- production readiness

That is the correct focus area for the current development cycle.
