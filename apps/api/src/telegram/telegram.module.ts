import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { TelegramController } from "./telegram.controller";
import { TelegramInternalGuard } from "./telegram-internal.guard";
import { TelegramSelfController } from "./telegram-self.controller";
import { TelegramService } from "./telegram.service";

@Module({
  imports: [UsersModule],
  controllers: [TelegramController, TelegramSelfController],
  providers: [TelegramService, TelegramInternalGuard]
})
export class TelegramModule {}
