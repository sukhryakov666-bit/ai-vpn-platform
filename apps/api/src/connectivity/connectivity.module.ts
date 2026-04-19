import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { ConnectivityController } from "./connectivity.controller";
import { ConnectivityService } from "./connectivity.service";

@Module({
  controllers: [ConnectivityController],
  providers: [PrismaService, ConnectivityService]
})
export class ConnectivityModule {}
