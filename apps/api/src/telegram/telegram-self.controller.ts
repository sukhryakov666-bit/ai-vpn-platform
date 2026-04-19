import { Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtPayload } from "@ai-vpn/shared-types";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TelegramService } from "./telegram.service";

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags("telegram")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("telegram-self")
export class TelegramSelfController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post("link-code")
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  createOwnLinkCode(@Req() req: RequestWithUser): Promise<{ code: string; expiresAt: string }> {
    return this.telegramService.createLinkCodeForUserId(req.user.sub);
  }
}
