import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ProvisionWireGuardDto {
  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsBoolean()
  reuseActive?: boolean;
}
