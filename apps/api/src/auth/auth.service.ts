import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "@ai-vpn/shared-types";
import * as bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { PrismaService } from "../prisma.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(email, passwordHash);
    return this.issueTokens({ sub: user.id, email: user.email }, user.id);
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueTokens({ sub: user.id, email: user.email }, user.id);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET")
      });
      const hash = this.hashToken(refreshToken);
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: hash }
      });

      if (!storedToken || storedToken.userId !== payload.sub || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const nextTokens = await this.issueTokens(payload, payload.sub);
      const nextHash = this.hashToken(nextTokens.refreshToken);
      const nextStoredToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: nextHash }
      });

      if (nextStoredToken) {
        await this.prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: {
            revokedAt: new Date(),
            replacedById: nextStoredToken.id
          }
        });
      }

      return nextTokens;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const hash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: hash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
    return { success: true };
  }

  private async issueTokens(payload: JwtPayload, userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: "15m"
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: "30d"
    });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
