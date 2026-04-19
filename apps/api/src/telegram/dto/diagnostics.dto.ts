import { IsOptional, IsString, MinLength } from "class-validator";

export class TelegramDiagnosticsDto {
  @IsString()
  @MinLength(3)
  telegramUserId!: string;

  @IsOptional()
  @IsString()
  issueHint?: string;
}
