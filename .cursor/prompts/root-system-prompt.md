# Root System Context: AI-assisted VPN + Proxy Platform

## Main Rule
This document is the root system context of the project.
For all future tasks, always:
1. Use this prompt as the primary source of project rules.
2. Use `.cursor/*.md` as long-term project memory.
3. Respect accepted architectural decisions.
4. Do not change the stack, structure, or concept without explanation.
5. Keep track of the current implementation stage.

If task context is missing, restore it from:
- this root prompt,
- `.cursor/product-context.md`,
- `.cursor/architecture-rules.md`,
- `.cursor/implementation-plan.md`,
- `.cursor/project-state.md`.

## Project Essence
Project: **AI-assisted VPN + Proxy Platform**.

Goal: build a stable, anti-censorship, user-friendly VPN + Proxy service with smart automation.

### Core User Pains
- VPN/proxy nodes get blocked frequently.
- Connections can be unstable and disconnect.
- Users do not know what node/protocol/mode to choose.
- Existing products are often too complex.
- UX should be "one click and it works".
- Fallback mode is required when the main path is blocked.
- Product should support both VPN and proxy scenarios.

### Product Idea
Combine:
- **WireGuard** as primary fast VPN mode.
- **XRay** as anti-block/proxy/fallback core.
- Backend for users, nodes, subscriptions, and config management.
- Telegram bot for onboarding, support, access, and diagnostics.
- Smart layer for best-mode choice, best-node choice, fallback, diagnostics, and human-readable explanations.

## AI Layer Scope
AI does not replace VPN/proxy protocols. It is an intelligent control layer.

MVP implementation is:
- rule-based logic,
- scoring engine,
- deterministic recommendation engine,
- diagnostics engine.

No complex ML is required at startup. First priority is reliable infra and backend.

Smart layer responsibilities:
- best node selection,
- connection mode selection,
- fallback between WireGuard and XRay,
- error diagnostics,
- plain-language issue explanation,
- recommended next action.

## Default Technology Stack
- Monorepo
- TypeScript
- Backend API: NestJS
- ORM: Prisma
- Database: PostgreSQL
- Cache/Queue: Redis
- Admin/User cabinet: Next.js
- Telegram bot: Telegraf
- Infra: Docker Compose
- Monitoring: Prometheus + Grafana
- Reverse proxy: Nginx or Traefik
- Auth: JWT + refresh tokens
- Validation: class-validator / zod / env validation
- API docs: Swagger / OpenAPI

Do not change the stack without explicit rationale.

## Required Root Structure
```bash
ai-vpn-platform/
├── apps/
│   ├── api/
│   ├── admin-web/
│   └── telegram-bot/
├── services/
│   ├── node-monitor/
│   ├── recommendation-engine/
│   ├── config-generator/
│   ├── diagnostics-engine/
│   └── incident-processor/
├── packages/
│   ├── shared-types/
│   ├── shared-config/
│   ├── shared-utils/
│   └── ui-kit/
├── infra/
│   ├── docker/
│   ├── nginx/
│   ├── prometheus/
│   ├── grafana/
│   ├── scripts/
│   └── env/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── product/
│   ├── runbooks/
│   └── roadmap/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .cursor/
│   ├── product-context.md
│   ├── architecture-rules.md
│   ├── implementation-plan.md
│   ├── project-state.md
│   └── prompts/
├── .github/
│   └── workflows/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml
├── .env.example
├── README.md
└── Makefile
```
