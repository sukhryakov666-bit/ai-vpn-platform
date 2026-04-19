# AI-assisted VPN + Proxy Platform

Production-oriented monorepo for a resilient VPN + Proxy service with an AI-assisted (rule-based at MVP) control layer.

## Core Principles
- Stability first.
- Anti-block readiness.
- One-click user experience.
- Deterministic smart recommendations and diagnostics.

## Primary Stack
- TypeScript monorepo
- NestJS + Prisma + PostgreSQL + Redis
- Next.js admin/user cabinet
- Telegraf Telegram bot
- WireGuard + XRay connectivity core

## Project Memory
Long-term context is stored in:
- `.cursor/prompts/root-system-prompt.md`
- `.cursor/product-context.md`
- `.cursor/architecture-rules.md`
- `.cursor/implementation-plan.md`
- `.cursor/project-state.md`

## Quick Start
1. Install dependencies:
   - `corepack pnpm install`
2. Start local infra:
   - `make up`
3. Generate Prisma client:
   - `corepack pnpm --filter @ai-vpn/api prisma:generate`
4. Build and typecheck:
   - `corepack pnpm typecheck`
   - `corepack pnpm build`

API docs are available at `http://localhost:3000/api/docs` after API startup.

## Observability (Local)
- Loki: `http://localhost:3100`
- Grafana: `http://localhost:3001` (`admin/admin`)
- Promtail ships Docker logs to Loki using structured JSON parsing for `request_id` correlation.
bp test
