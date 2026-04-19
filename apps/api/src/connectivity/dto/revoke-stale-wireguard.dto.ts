import { IsNumber, IsOptional, Min } from "class-validator";

export class RevokeStaleWireGuardDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAgeHours?: number;
}
