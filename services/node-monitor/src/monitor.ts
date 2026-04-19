import {
  NodeHealthSnapshot,
  NodeHealthStatus,
  NodeProbeSample,
  NodeProbeTarget
} from "@ai-vpn/shared-types";

type NodeState = {
  consecutiveFailures: number;
  lastSnapshot?: NodeHealthSnapshot;
};

export class NodeMonitorService {
  private readonly state = new Map<string, NodeState>();

  async probe(target: NodeProbeTarget): Promise<NodeProbeSample> {
    const startedAt = Date.now();
    const timeoutMs = target.timeoutMs ?? 3000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(target.probeUrl, {
        method: "GET",
        signal: controller.signal
      });
      const latencyMs = Date.now() - startedAt;
      return {
        nodeId: target.nodeId,
        protocol: target.protocol,
        checkedAt: new Date().toISOString(),
        latencyMs,
        ok: response.ok,
        error: response.ok ? undefined : `HTTP_${response.status}`
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      return {
        nodeId: target.nodeId,
        protocol: target.protocol,
        checkedAt: new Date().toISOString(),
        latencyMs,
        ok: false,
        error: error instanceof Error ? error.message : "probe_error"
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  toSnapshot(target: NodeProbeTarget, sample: NodeProbeSample): NodeHealthSnapshot {
    const current = this.state.get(target.nodeId) ?? { consecutiveFailures: 0 };
    const consecutiveFailures = sample.ok ? 0 : current.consecutiveFailures + 1;
    const score = this.calculateScore(sample.latencyMs, consecutiveFailures, sample.ok);
    const status = this.toStatus(score, sample.ok, consecutiveFailures);

    const snapshot: NodeHealthSnapshot = {
      nodeId: target.nodeId,
      region: target.region,
      protocol: target.protocol,
      status,
      score,
      checkedAt: sample.checkedAt,
      latencyMs: sample.latencyMs,
      consecutiveFailures
    };

    this.state.set(target.nodeId, {
      consecutiveFailures,
      lastSnapshot: snapshot
    });

    return snapshot;
  }

  getLastSnapshot(nodeId: string): NodeHealthSnapshot | undefined {
    return this.state.get(nodeId)?.lastSnapshot;
  }

  private calculateScore(latencyMs: number, consecutiveFailures: number, ok: boolean): number {
    const latencyPenalty = Math.min(60, Math.floor(latencyMs / 20));
    const failurePenalty = consecutiveFailures * 25;
    const baseScore = ok ? 100 : 40;
    return Math.max(0, Math.min(100, baseScore - latencyPenalty - failurePenalty));
  }

  private toStatus(score: number, ok: boolean, consecutiveFailures: number): NodeHealthStatus {
    if (!ok && consecutiveFailures >= 2) {
      return NodeHealthStatus.Unhealthy;
    }
    if (score >= 75) {
      return NodeHealthStatus.Healthy;
    }
    if (score >= 45) {
      return NodeHealthStatus.Degraded;
    }
    return NodeHealthStatus.Unhealthy;
  }
}
