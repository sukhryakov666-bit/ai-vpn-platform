import { Telegraf } from "telegraf";
import { BotContext, BotDeps } from "../types";

export function registerHelpHandler(bot: Telegraf<BotContext>, _deps: BotDeps): void {
  bot.help(async (ctx) => {
    await ctx.reply(
      [
        "Available commands:",
        "/start - onboarding entry point",
        "/help - command list",
        "/link <code> - link Telegram with your account",
        "/status - service availability check",
        "/diagnostics - quick troubleshooting hints"
      ].join("\n")
    );
  });
}
