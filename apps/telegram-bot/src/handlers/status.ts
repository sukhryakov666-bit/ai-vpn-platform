import { Telegraf } from "telegraf";
import { BotContext, BotDeps } from "../types";

export function registerStatusHandler(bot: Telegraf<BotContext>, deps: BotDeps): void {
  bot.command("status", async (ctx) => {
    const telegramUserId = String(ctx.from?.id ?? "");
    if (!telegramUserId) {
      await ctx.reply("Unable to read Telegram profile ID.");
      return;
    }

    try {
      const status = await deps.apiClient.status(telegramUserId);
      await ctx.reply(`Status: ${status.message}`);
    } catch {
      await ctx.reply("Status service is temporarily unavailable.");
    }
  });
}
