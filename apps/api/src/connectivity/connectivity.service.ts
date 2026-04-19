import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { NodeHealth, NodeProtocol, WireGuardProfileStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma.service";
import { ProvisionWireGuardDto } from "./dto/provision-wireguard.dto";

@Injectable()
export class ConnectivityService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionWireGuardProfile(userId: string, dto: ProvisionWireGuardDto) {
    const reuseActive = dto.reuseActive ?? true;
    const node = await this.prisma.node.findFirst({
      where: {
        protocol: NodeProtocol.wireguard,
        isActive: true,
        health: { in: [NodeHealth.healthy, NodeHealth.degraded] },
        ...(dto.region ? { region: dto.region } : {})
      },
      orderBy: [{ score: "desc" }, { createdAt: "asc" }]
    });

    if (!node) {
      throw new NotFoundException("wireguard_node_not_available");
    }

    if (reuseActive) {
      const existingActive = await this.prisma.wireGuardProfile.findFirst({
        where: {
          userId,
          nodeId: node.id,
          status: WireGuardProfileStatus.active
        },
        orderBy: { createdAt: "desc" }
      });
      if (existingActive) {
        return {
          profileId: existingActive.id,
          node: {
            id: node.id,
            name: node.name,
            region: node.region
          },
          config: existingActive.config
        };
      }
    }

    const activeProfiles = await this.prisma.wireGuardProfile.findMany({
      where: { nodeId: node.id, status: WireGuardProfileStatus.active },
      select: { clientAddress: true }
    });
    const clientAddress = this.allocateClientAddress(node.addressPoolCidr, activeProfiles.map((p) => p.clientAddress));
    const clientPrivateKey = this.generateKey();
    const clientPublicKey = this.generateKey();
    const preSharedKey = this.generateKey();
    const config = this.renderClientConfig({
      clientPrivateKey,
      clientAddress,
      dns: node.dns,
      serverPublicKey: node.publicKey,
      preSharedKey,
      allowedIps: node.allowedIps,
      endpoint: `${node.endpointHost}:${node.endpointPort}`
    });

    const profile = await this.prisma.wireGuardProfile.create({
      data: {
        userId,
        nodeId: node.id,
        clientPrivateKey,
        clientPublicKey,
        preSharedKey,
        clientAddress,
        config
      }
    });

    return {
      profileId: profile.id,
      node: {
        id: node.id,
        name: node.name,
        region: node.region
      },
      config
    };
  }

  async revokeWireGuardProfile(userId: string, profileId: string) {
    const profile = await this.prisma.wireGuardProfile.findFirst({
      where: {
        id: profileId,
        userId
      }
    });
    if (!profile) {
      throw new NotFoundException("wireguard_profile_not_found");
    }

    if (profile.status === WireGuardProfileStatus.revoked) {
      return {
        revoked: true as const,
        profileId: profile.id,
        revokedAt: profile.revokedAt?.toISOString() ?? null
      };
    }

    const now = new Date();
    const revoked = await this.prisma.wireGuardProfile.update({
      where: { id: profileId },
      data: {
        status: WireGuardProfileStatus.revoked,
        revokedAt: now
      }
    });
    return {
      revoked: true as const,
      profileId: revoked.id,
      revokedAt: revoked.revokedAt?.toISOString() ?? now.toISOString()
    };
  }

  async listWireGuardProfiles(userId: string) {
    const profiles = await this.prisma.wireGuardProfile.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        nodeId: true,
        status: true,
        createdAt: true,
        revokedAt: true,
        clientAddress: true
      }
    });

    return profiles.map((profile) => ({
      profileId: profile.id,
      nodeId: profile.nodeId,
      status: profile.status,
      clientAddress: profile.clientAddress,
      createdAt: profile.createdAt.toISOString(),
      revokedAt: profile.revokedAt?.toISOString() ?? null
    }));
  }

  async revokeStaleWireGuardProfiles(userId: string, maxAgeHours = 24) {
    if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0) {
      throw new ConflictException("invalid_wireguard_stale_max_age_hours");
    }

    const staleThreshold = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const staleActiveProfiles = await this.prisma.wireGuardProfile.findMany({
      where: {
        userId,
        status: WireGuardProfileStatus.active,
        createdAt: { lt: staleThreshold }
      },
      select: { id: true }
    });

    if (staleActiveProfiles.length === 0) {
      return {
        revokedCount: 0,
        revokedProfileIds: [] as string[],
        staleThreshold: staleThreshold.toISOString()
      };
    }

    const profileIds = staleActiveProfiles.map((profile) => profile.id);
    const now = new Date();
    await this.prisma.wireGuardProfile.updateMany({
      where: {
        id: { in: profileIds },
        userId,
        status: WireGuardProfileStatus.active
      },
      data: {
        status: WireGuardProfileStatus.revoked,
        revokedAt: now
      }
    });

    return {
      revokedCount: profileIds.length,
      revokedProfileIds: profileIds,
      staleThreshold: staleThreshold.toISOString()
    };
  }

  private generateKey(): string {
    return randomBytes(32).toString("base64");
  }

  private allocateClientAddress(cidr: string, usedAddresses: string[]): string {
    const [baseIp, prefixRaw] = cidr.split("/");
    const prefix = Number(prefixRaw);
    if (!Number.isInteger(prefix) || prefix < 16 || prefix > 30) {
      throw new ConflictException("unsupported_wireguard_pool_cidr");
    }

    const networkStart = this.ipToInt(baseIp);
    const hostSpace = 2 ** (32 - prefix);
    if (hostSpace < 4) {
      throw new ConflictException("wireguard_pool_too_small");
    }

    const used = new Set<number>();
    for (const address of usedAddresses) {
      const [ip] = address.split("/");
      used.add(this.ipToInt(ip));
    }

    const firstHost = networkStart + 2; // reserve .1 for server
    const lastHost = networkStart + hostSpace - 2; // reserve broadcast
    for (let candidate = firstHost; candidate <= lastHost; candidate += 1) {
      if (!used.has(candidate)) {
        return `${this.intToIp(candidate)}/32`;
      }
    }

    throw new ConflictException("wireguard_address_pool_exhausted");
  }

  private ipToInt(ip: string): number {
    const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
      throw new ConflictException("invalid_wireguard_pool_ip");
    }
    return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
  }

  private intToIp(value: number): string {
    return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");
  }

  private renderClientConfig(input: {
    clientPrivateKey: string;
    clientAddress: string;
    dns: string;
    serverPublicKey: string;
    preSharedKey: string;
    allowedIps: string;
    endpoint: string;
  }): string {
    return [
      "[Interface]",
      `PrivateKey = ${input.clientPrivateKey}`,
      `Address = ${input.clientAddress}`,
      `DNS = ${input.dns}`,
      "",
      "[Peer]",
      `PublicKey = ${input.serverPublicKey}`,
      `PresharedKey = ${input.preSharedKey}`,
      `AllowedIPs = ${input.allowedIps}`,
      `Endpoint = ${input.endpoint}`,
      "PersistentKeepalive = 25"
    ].join("\n");
  }
}
