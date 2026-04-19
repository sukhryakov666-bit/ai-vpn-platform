import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../prisma.service";
import { TelegramDiagnosticsDto } from "./dto/diagnostics.dto";
import { CreateTelegramLinkCodeDto } from "./dto/create-link-code.dto";
import { RedeemTelegramLinkCodeDto } from "./dto/redeem-link-code.dto";
import { UsersService } from "../users/users.service";

@Injectable()
export class TelegramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService
  ) {}

  async createLinkCode(dto: CreateTelegramLinkCodeDto): Promise<{ code: string; expiresAt: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.createLinkCodeForUserId(user.id);
  }

  async createLinkCodeForUserId(userId: string): Promise<{ code: string; expiresAt: string }> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.telegramLinkCode.create({
      data: {
        userId,
        codeHash: this.hashCode(code),
        expiresAt
      }
    });

    return {
      code,
      expiresAt: expiresAt.toISOString()
    };
  }

  async redeemLinkCode(dto: RedeemTelegramLinkCodeDto): Promise<{ linked: true; email: string }> {
    const now = new Date();
    const code = await this.prisma.telegramLinkCode.findUnique({
      where: { codeHash: this.hashCode(dto.code) },
      include: { user: true }
    });
    if (!code || code.usedAt || code.expiresAt <= now) {
      throw new NotFoundException("Invalid or expired link code");
    }

    await this.usersService.linkTelegramProfile(code.userId, dto.telegramUserId, dto.telegramUsername);
    await this.prisma.telegramLinkCode.update({
      where: { id: code.id },
      data: { usedAt: now }
    });

    return {
      linked: true,
      email: code.user.email
    };
  }

  async getStatus(telegramUserId: string): Promise<{ connected: boolean; message: string }> {
    const user = await this.usersService.findByTelegramUserId(telegramUserId);
    if (!user) {
      return {
        connected: false,
        message: "Account is not linked. Use /link <one-time-code>."
      };
    }

    return {
      connected: true,
      message: "Account linked. Control plane is operational."
    };
  }

  async getDiagnostics(dto: TelegramDiagnosticsDto): Promise<{ summary: string; nextActions: string[] }> {
    const user = await this.usersService.findByTelegramUserId(dto.telegramUserId);
    if (!user) {
      return {
        summary: "Unable to identify your account profile.",
        nextActions: [
          "Link Telegram account via /link <one-time-code>.",
          "Retry diagnostics after account linking."
        ]
      };
    }

    const hint = dto.issueHint?.toLowerCase() ?? "";
    if (hint.includes("blocked") || hint.includes("ban")) {
      return {
        summary: "Primary route is likely blocked by network restrictions.",
        nextActions: [
          "Switch to XRay fallback profile.",
          "Retry from a different network for isolation testing.",
          "If issue remains, share ISP and region with support."
        ]
      };
    }

    return {
      summary: "Most common cause is unstable network path or stale client profile.",
      nextActions: [
        "Reconnect and refresh config profile.",
        "Switch between Wi-Fi and mobile network.",
        "If WireGuard fails, use fallback XRay route."
      ]
    };
  }

  private generateCode(): string {
    return randomBytes(4).toString("hex").toUpperCase();
  }

  private hashCode(code: string): string {
    return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
  }
}
