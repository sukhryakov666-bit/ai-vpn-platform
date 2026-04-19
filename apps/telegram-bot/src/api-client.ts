import { randomUUID } from "crypto";

type ApiClientOptions = {
  baseUrl: string;
  internalToken: string;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async linkTelegram(input: {
    code: string;
    telegramUserId: string;
    telegramUsername?: string;
  }): Promise<{ linked: boolean; email: string }> {
    return this.request<{ linked: boolean; email: string }>("/telegram/link", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async status(telegramUserId: string): Promise<{ connected: boolean; message: string }> {
    return this.request<{ connected: boolean; message: string }>(
      `/telegram/status/${encodeURIComponent(telegramUserId)}`,
      { method: "GET" }
    );
  }

  async diagnostics(input: {
    telegramUserId: string;
    issueHint?: string;
  }): Promise<{ summary: string; nextActions: string[] }> {
    return this.request<{ summary: string; nextActions: string[] }>("/telegram/diagnostics", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const requestId = randomUUID();
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-telegram-internal-token": this.options.internalToken,
        "x-request-id": requestId,
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      const upstreamRequestId = response.headers.get("x-request-id") ?? requestId;
      throw new Error(`API request failed with status ${response.status} (request_id=${upstreamRequestId})`);
    }
    return (await response.json()) as T;
  }
}
