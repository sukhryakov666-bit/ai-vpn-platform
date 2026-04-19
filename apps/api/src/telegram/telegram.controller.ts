import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateTelegramLinkCodeDto } from "./dto/create-link-code.dto";
import { TelegramDiagnosticsDto } from "./dto/diagnostics.dto";
import { RedeemTelegramLinkCodeDto } from "./dto/redeem-link-code.dto";
import { TelegramInternalGuard } from "./telegram-internal.guard";
import { TelegramService } from "./telegram.service";

@ApiTags("telegram")
@UseGuards(TelegramInternalGuard)
@Controller("telegram")
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post("link-code")
  createLinkCode(@Body() dto: CreateTelegramLinkCodeDto): Promise<{ code: string; expiresAt: string }> {
    return this.telegramService.createLinkCode(dto);
  }

  @Post("link")
  redeemLink(@Body() dto: RedeemTelegramLinkCodeDto): Promise<{ linked: true; email: string }> {
    return this.telegramService.redeemLinkCode(dto);
  }

  @Get("status/:telegramUserId")
  status(@Param("telegramUserId") telegramUserId: string): Promise<{ connected: boolean; message: string }> {
    return this.telegramService.getStatus(telegramUserId);
  }

  @Post("diagnostics")
  diagnostics(@Body() dto: TelegramDiagnosticsDto): Promise<{ summary: string; nextActions: string[] }> {
    return this.telegramService.getDiagnostics(dto);
  }
}
