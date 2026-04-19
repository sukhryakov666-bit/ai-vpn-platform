# Architecture Rules

## Non-negotiable Constraints
- Keep monorepo structure.
- Keep TypeScript-first stack.
- Keep NestJS + Prisma + PostgreSQL + Redis backend core.
- Keep WireGuard as primary VPN mode and XRay as anti-block/fallback core.
- Keep Telegram bot as primary support/onboarding channel.

## Change Management
- Do not change stack or architecture baseline without explicit rationale.
- Keep backward-compatible API contracts where possible.
- Introduce changes incrementally with clear migration steps.

## Reliability
- Any network path should support health checks and fallback.
- Diagnostics must produce user-readable explanations.
