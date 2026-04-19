import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "@ai-vpn/shared-types";

type RequestWithUser = {
  user?: JwtPayload;
};

@Injectable()
export class AdminEmailGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const email = request.user?.email;
    if (!email) {
      throw new ForbiddenException("admin_email_required");
    }

    const allowlist = this.configService
      .get<string>("ADMIN_EMAIL_ALLOWLIST", "admin@ai-vpn.local")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (!allowlist.includes(email.toLowerCase())) {
      throw new ForbiddenException("admin_access_required");
    }

    return true;
  }
}
