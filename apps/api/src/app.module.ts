import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { readEnv } from "@ai-vpn/shared-config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { ConnectivityModule } from "./connectivity/connectivity.module";
import { HealthModule } from "./health/health.module";
import { NodesModule } from "./nodes/nodes.module";
import { TelegramModule } from "./telegram/telegram.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: readEnv
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120
      }
    ]),
    HealthModule,
    AuthModule,
    UsersModule,
    TelegramModule,
    NodesModule,
    ConnectivityModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
