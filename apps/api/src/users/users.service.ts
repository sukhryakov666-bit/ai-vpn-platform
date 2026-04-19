import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(email: string, passwordHash: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash
      }
    });
  }

  findByTelegramUserId(telegramUserId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { telegramUserId }
    });
  }

  linkTelegramProfile(userId: string, telegramUserId: string, telegramUsername?: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        telegramUserId,
        telegramUsername,
        telegramLinkedAt: new Date()
      }
    });
  }
}
