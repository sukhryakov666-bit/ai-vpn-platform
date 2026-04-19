import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "../prisma.service";
import { AdminEmailGuard } from "../auth/admin-email.guard";
import { NodesController } from "./nodes.controller";
import { NodesService } from "./nodes.service";

@Module({
  imports: [ConfigModule],
  controllers: [NodesController],
  providers: [PrismaService, NodesService, AdminEmailGuard],
  exports: [NodesService]
})
export class NodesModule {}
