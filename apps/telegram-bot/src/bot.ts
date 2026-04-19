import { Telegraf } from "telegraf";
import { registerDiagnosticsHandler } from "./handlers/diagnostics";
import { registerHelpHandler } from "./handlers/help";
import { registerLinkHandler } from "./handlers/link";
import { registerStartHandler } from "./handlers/start";
import { registerStatusHandler } from "./handlers/status";
import { BotContext, BotDeps } from "./types";

export function createBot(token: string, deps: BotDeps): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(token);

  registerStartHandler(bot, deps);
  registerHelpHandler(bot, deps);
  registerLinkHandler(bot, deps);
  registerStatusHandler(bot, deps);
  registerDiagnosticsHandler(bot, deps);

  bot.catch((error, ctx) => {
    // Keep failures visible in logs while responding gracefully to users.
    console.error("Telegram bot handler error:", error, {
      updateId: ctx.update.update_id
    });
  });

  return bot;
}
