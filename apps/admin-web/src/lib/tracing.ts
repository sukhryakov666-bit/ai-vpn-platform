import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export function getRequestId(request: NextRequest): string {
  const incoming = request.headers.get("x-request-id");
  if (incoming && incoming.trim().length > 0) {
    return incoming;
  }
  return randomUUID();
}

export function logEvent(component: string, event: string, payload: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      component,
      event,
      ...payload
    })
  );
}
