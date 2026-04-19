import { Telegraf } from "telegraf";
import { BotContext, BotDeps } from "../types";

export function registerLinkHandler(bot: Telegraf<BotContext>, deps: BotDeps): void {
  bot.command("link", async (ctx) => {
    const rawText = ctx.message && "text" in ctx.message ? ctx.message.text : "";
    const code = rawText.split(" ").slice(1).join(" ").trim();

    if (!code) {
      await ctx.reply("Usage: /link YOUR_ONE_TIME_CODE");
      return;
    }

    const telegramUserId = String(ctx.from?.id ?? "");
    if (!telegramUserId) {
      await ctx.reply("Unable to read Telegram profile ID. Please retry.");
      return;
    }

    try {
      const result = await deps.apiClient.linkTelegram({
        code,
        telegramUserId,
        telegramUsername: ctx.from?.username
      });
      await ctx.reply(`Account linked successfully: ${result.email}`);
    } catch {
      await ctx.reply("Unable to link account. Verify one-time code and retry.");
    }
  });
}
