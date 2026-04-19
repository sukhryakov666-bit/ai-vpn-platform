import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(12),
  JWT_REFRESH_SECRET: z.string().min(12),
  ADMIN_EMAIL_ALLOWLIST: z.string().default("admin@ai-vpn.local"),
  CORS_ORIGIN: z.string().default("http://localhost:3001"),
  ENABLE_SWAGGER: z.enum(["true", "false"]).default("true"),
  TELEGRAM_INTERNAL_TOKEN: z.string().min(12).optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional()
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(env: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(env);
}
