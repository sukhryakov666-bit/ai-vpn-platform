export enum ConnectionMode {
  WireGuard = "wireguard",
  Xray = "xray"
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export enum NodeProtocol {
  WireGuard = "wireguard",
  Xray = "xray"
}

export enum NodeHealthStatus {
  Healthy = "healthy",
  Degraded = "degraded",
  Unhealthy = "unhealthy"
}

export interface NodeProbeTarget {
  nodeId: string;
  region: string;
  protocol: NodeProtocol;
  probeUrl: string;
  timeoutMs?: number;
}

export interface NodeProbeSample {
  nodeId: string;
  protocol: NodeProtocol;
  checkedAt: string;
  latencyMs: number;
  ok: boolean;
  error?: string;
}

export interface NodeHealthSnapshot {
  nodeId: string;
  region: string;
  protocol: NodeProtocol;
  status: NodeHealthStatus;
  score: number;
  checkedAt: string;
  latencyMs: number;
  consecutiveFailures: number;
}
