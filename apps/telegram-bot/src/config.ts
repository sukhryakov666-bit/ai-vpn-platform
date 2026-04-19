import { z } from "zod";

const botEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TELEGRAM_BOT_TOKEN: z.string().min(10),
  BOT_HEALTH_PORT: z.coerce.number().default(3002),
  API_BASE_URL: z.string().url().default("http://localhost:3000/api"),
  TELEGRAM_INTERNAL_TOKEN: z.string().min(12)
});

export type BotEnv = z.infer<typeof botEnvSchema>;

export function readBotEnv(env: Record<string, string | undefined>): BotEnv {
  return botEnvSchema.parse(env);
}
