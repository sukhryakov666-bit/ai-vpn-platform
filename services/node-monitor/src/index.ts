import { NodeHealth, NodeProtocol as PrismaNodeProtocol, PrismaClient } from "@prisma/client";
import { NodeHealthStatus, NodeProbeTarget, NodeProtocol } from "@ai-vpn/shared-types";
import { NodeMonitorService } from "./monitor";

const prisma = new PrismaClient();

async function run(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for node-monitor");
  }
  const monitor = new NodeMonitorService();
  const targets = await loadTargets();
  const snapshots = [];

  for (const target of targets) {
    const sample = await monitor.probe(target);
    const snapshot = monitor.toSnapshot(target, sample);
    await prisma.node.update({
      where: { id: target.nodeId },
      data: {
        health: toPrismaHealth(snapshot.status),
        score: snapshot.score
      }
    });
    snapshots.push(snapshot);
  }

  // CLI-friendly output for local smoke checks and cron wrappers.
  process.stdout.write(`${JSON.stringify({ snapshots }, null, 2)}\n`);
}

async function loadTargets(): Promise<NodeProbeTarget[]> {
  const nodes = await prisma.node.findMany({
    where: {
      isActive: true
    },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }]
  });

  return nodes.map((node) => ({
    nodeId: node.id,
    region: node.region,
    protocol: toSharedProtocol(node.protocol),
    probeUrl: `http://${node.endpointHost}:${node.endpointPort}/health`,
    timeoutMs: 3000
  }));
}

function toSharedProtocol(protocol: PrismaNodeProtocol): NodeProtocol {
  return protocol === PrismaNodeProtocol.wireguard ? NodeProtocol.WireGuard : NodeProtocol.Xray;
}

function toPrismaHealth(status: NodeHealthStatus): NodeHealth {
  if (status === NodeHealthStatus.Healthy) {
    return NodeHealth.healthy;
  }
  if (status === NodeHealthStatus.Degraded) {
    return NodeHealth.degraded;
  }
  return NodeHealth.unhealthy;
}

void run().finally(async () => {
  await prisma.$disconnect();
});
