import { IsOptional, IsString, MinLength } from "class-validator";

export class RedeemTelegramLinkCodeDto {
  @IsString()
  @MinLength(6)
  code!: string;

  @IsString()
  @MinLength(3)
  telegramUserId!: string;

  @IsOptional()
  @IsString()
  telegramUsername?: string;
}
