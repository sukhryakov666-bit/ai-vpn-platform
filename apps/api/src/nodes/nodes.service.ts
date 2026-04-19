import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { NodeProtocol, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { CreateNodeDto } from "./dto/create-node.dto";
import { UpdateNodeDto } from "./dto/update-node.dto";

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNodeDto) {
    await this.assertUniqueEndpoint(dto.endpointHost, dto.endpointPort);
    try {
      return await this.prisma.node.create({ data: dto });
    } catch (error) {
      this.rethrowKnownEndpointConflict(error);
      throw error;
    }
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

    const nextHost = dto.endpointHost ?? existing.endpointHost;
    const nextPort = dto.endpointPort ?? existing.endpointPort;
    await this.assertUniqueEndpoint(nextHost, nextPort, nodeId);

    try {
      return await this.prisma.node.update({
        where: { id: nodeId },
        data: dto
      });
    } catch (error) {
      this.rethrowKnownEndpointConflict(error);
      throw error;
    }
  }

  private async assertUniqueEndpoint(endpointHost: string, endpointPort: number, excludeNodeId?: string): Promise<void> {
    const duplicate = await this.prisma.node.findFirst({
      where: {
        endpointHost,
        endpointPort,
        ...(excludeNodeId ? { NOT: { id: excludeNodeId } } : {})
      },
      select: { id: true }
    });

    if (duplicate) {
      throw new ConflictException("node_endpoint_already_exists");
    }
  }

  private rethrowKnownEndpointConflict(error: unknown): never | void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta?.target : [];
      if (target.includes("endpointHost") && target.includes("endpointPort")) {
        throw new ConflictException("node_endpoint_already_exists");
      }
    }
  }
}
