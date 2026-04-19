import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { NodeHealth, NodeProtocol } from "@prisma/client";

export class CreateNodeDto {
  @IsString()
  @Matches(/^[a-z0-9-]{3,64}$/i)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]{2,64}$/i)
  region!: string;

  @IsEnum(NodeProtocol)
  protocol!: NodeProtocol;

  @IsString()
  @Matches(/^(([a-z0-9-]+\.)+[a-z]{2,}|(\d{1,3}\.){3}\d{1,3})$/i)
  endpointHost!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  endpointPort!: number;

  @IsString()
  @MinLength(16)
  publicKey!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9./, ]+$/)
  allowedIps?: string;

  @IsOptional()
  @IsString()
  dns?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/)
  addressPoolCidr?: string;

  @IsOptional()
  @IsEnum(NodeHealth)
  health?: NodeHealth;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
