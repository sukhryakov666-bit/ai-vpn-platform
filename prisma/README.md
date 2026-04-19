# Prisma schema source of truth

Single Prisma schema is maintained in `apps/api/prisma/schema.prisma`.

Use API package scripts:

- `pnpm --filter @ai-vpn/api prisma:generate`
- `pnpm --filter @ai-vpn/api prisma:migrate`
- `pnpm --filter @ai-vpn/api prisma:seed`
