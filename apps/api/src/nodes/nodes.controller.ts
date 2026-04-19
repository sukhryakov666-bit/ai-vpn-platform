import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NodeProtocol } from "@prisma/client";
import { AdminEmailGuard } from "../auth/admin-email.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateNodeDto } from "./dto/create-node.dto";
import { UpdateNodeDto } from "./dto/update-node.dto";
import { NodesService } from "./nodes.service";

@ApiTags("nodes")
@Controller("nodes")
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  create(@Body() dto: CreateNodeDto) {
    return this.nodesService.create(dto);
  }

  @Get()
  list(@Query("protocol") protocol?: NodeProtocol) {
    return this.nodesService.list(protocol);
  }

  @Patch(":nodeId")
  @UseGuards(JwtAuthGuard, AdminEmailGuard)
  update(@Param("nodeId") nodeId: string, @Body() dto: UpdateNodeDto) {
    return this.nodesService.update(nodeId, dto);
  }
}
