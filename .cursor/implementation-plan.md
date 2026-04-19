# Implementation Plan

## Stage 1: Foundation
- Monorepo bootstrap and shared tooling.
- Base API service with auth and user model.
- Database schema and migrations.
- Docker compose for local environment.

## Stage 2: Connectivity Core
- Node registry and health checks.
- WireGuard config generation and lifecycle.
- XRay config generation and fallback routes.

## Stage 3: Smart Layer (Rule-based)
- Deterministic scoring for node/mode selection.
- Fallback decision engine.
- Diagnostics rules and human-readable explanations.

## Stage 4: Product Layer
- Telegram bot onboarding and diagnostics flows.
- Admin dashboard for users, nodes, plans, incidents.
- Monitoring and runbooks hardening.
