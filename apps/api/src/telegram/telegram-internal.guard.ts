import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TelegramInternalGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const expectedToken = this.configService.get<string>("TELEGRAM_INTERNAL_TOKEN");
    const actualToken = request.headers["x-telegram-internal-token"];

    if (!expectedToken || !actualToken || expectedToken !== actualToken) {
      throw new UnauthorizedException("Invalid internal token");
    }
    return true;
  }
}
