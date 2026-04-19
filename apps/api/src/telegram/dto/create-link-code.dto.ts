import { IsEmail } from "class-validator";

export class CreateTelegramLinkCodeDto {
  @IsEmail()
  email!: string;
}
