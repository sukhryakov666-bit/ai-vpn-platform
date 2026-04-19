import { Telegraf } from "telegraf";
import { BotContext, BotDeps } from "../types";

export function registerStartHandler(bot: Telegraf<BotContext>, _deps: BotDeps): void {
  bot.start(async (ctx) => {
    const firstName = ctx.from?.first_name ?? "friend";
    await ctx.reply(
      [
        `Hi, ${firstName}!`,
        "",
        "Welcome to AI VPN platform.",
        "I can help you with:",
        "- quick onboarding",
        "- diagnostics and fallback hints",
        "- support commands",
        "",
        "Use /help to see available actions."
      ].join("\n")
    );

    await ctx.reply("To link your account, send: /link YOUR_ONE_TIME_CODE");
  });
}
