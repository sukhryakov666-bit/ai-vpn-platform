import { ApiClient } from "./api-client";
import { createBot } from "./bot";
import { readBotEnv } from "./config";
import { startHealthServer } from "./health-server";

async function bootstrap(): Promise<void> {
  const env = readBotEnv(process.env);
  const apiClient = new ApiClient({
    baseUrl: env.API_BASE_URL,
    internalToken: env.TELEGRAM_INTERNAL_TOKEN
  });
  const bot = createBot(env.TELEGRAM_BOT_TOKEN, { apiClient });

  await bot.launch();
  startHealthServer(env.BOT_HEALTH_PORT);

  console.log("telegram-bot started successfully");

  const shutdown = async (): Promise<void> => {
    await bot.stop();
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown();
  });

  process.once("SIGTERM", () => {
    void shutdown();
  });
}

void bootstrap();
