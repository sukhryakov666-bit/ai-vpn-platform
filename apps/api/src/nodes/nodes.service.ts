import { Injectable, NotFoundException } from "@nestjs/common";
import { NodeProtocol, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { CreateNodeDto } from "./dto/create-node.dto";
import { UpdateNodeDto } from "./dto/update-node.dto";

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateNodeDto) {
    return this.prisma.node.create({ data: dto });
  }

  list(protocol?: NodeProtocol) {
    const where: Prisma.NodeWhereInput = protocol ? { protocol } : {};
    return this.prisma.node.findMany({
      where,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }]
    });
  }

  async update(nodeId: string, dto: UpdateNodeDto) {
    const existing = await this.prisma.node.findUnique({ where: { id: nodeId } });
    if (!existing) {
      throw new NotFoundException("node_not_found");
    }

    return this.prisma.node.update({
      where: { id: nodeId },
      data: dto
    });
  }
}
