import { Telegraf } from "telegraf";
import { BotContext, BotDeps } from "../types";

export function registerDiagnosticsHandler(bot: Telegraf<BotContext>, deps: BotDeps): void {
  bot.command("diagnostics", async (ctx) => {
    const telegramUserId = String(ctx.from?.id ?? "");
    if (!telegramUserId) {
      await ctx.reply("Unable to read Telegram profile ID.");
      return;
    }

    try {
      const result = await deps.apiClient.diagnostics({
        telegramUserId
      });
      await ctx.reply(
        [`Diagnostics: ${result.summary}`, "", ...result.nextActions.map((item, idx) => `${idx + 1}) ${item}`)].join("\n")
      );
    } catch {
      await ctx.reply("Diagnostics service is temporarily unavailable.");
    }
  });
}
