import assert from "node:assert/strict";
import test from "node:test";
import { registerDiagnosticsHandler } from "./diagnostics";
import { registerLinkHandler } from "./link";
import { registerStatusHandler } from "./status";

type CommandHandler = (ctx: { from?: { id?: number; username?: string }; message?: { text?: string }; reply: (text: string) => Promise<void> }) => Promise<void>;

function createBotMock(): {
  handlers: Map<string, CommandHandler>;
  command: (name: string, handler: CommandHandler) => void;
} {
  const handlers = new Map<string, CommandHandler>();
  return {
    handlers,
    command: (name: string, handler: CommandHandler) => {
      handlers.set(name, handler);
    }
  };
}

test("/link command uses API and confirms success", async () => {
  const bot = createBotMock();
  registerLinkHandler(
    bot as never,
    {
      apiClient: {
        linkTelegram: async () => ({ linked: true, email: "user@example.com" })
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("link");
  assert.ok(handler);
  await handler?.({
    from: { id: 123, username: "demo_user" },
    message: { text: "/link ABCD1234" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.equal(replies[0], "Account linked successfully: user@example.com");
});

test("/status command returns API status message", async () => {
  const bot = createBotMock();
  registerStatusHandler(
    bot as never,
    {
      apiClient: {
        status: async () => ({ connected: true, message: "Account linked. Control plane is operational." })
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("status");
  assert.ok(handler);
  await handler?.({
    from: { id: 123 },
    message: { text: "/status" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.equal(replies[0], "Status: Account linked. Control plane is operational.");
});

test("/diagnostics command formats next actions list", async () => {
  const bot = createBotMock();
  registerDiagnosticsHandler(
    bot as never,
    {
      apiClient: {
        diagnostics: async () => ({
          summary: "Primary route is likely blocked by network restrictions.",
          nextActions: ["Switch to XRay fallback profile.", "Retry from a different network."]
        })
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("diagnostics");
  assert.ok(handler);
  await handler?.({
    from: { id: 123 },
    message: { text: "/diagnostics" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.ok(replies[0].includes("Diagnostics: Primary route is likely blocked by network restrictions."));
  assert.ok(replies[0].includes("1) Switch to XRay fallback profile."));
  assert.ok(replies[0].includes("2) Retry from a different network."));
});

test("/link command validates required one-time code", async () => {
  const bot = createBotMock();
  registerLinkHandler(
    bot as never,
    {
      apiClient: {
        linkTelegram: async () => ({ linked: true, email: "user@example.com" })
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("link");
  assert.ok(handler);
  await handler?.({
    from: { id: 123 },
    message: { text: "/link" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.equal(replies[0], "Usage: /link YOUR_ONE_TIME_CODE");
});

test("/link command handles missing telegram user id", async () => {
  const bot = createBotMock();
  registerLinkHandler(
    bot as never,
    {
      apiClient: {
        linkTelegram: async () => ({ linked: true, email: "user@example.com" })
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("link");
  assert.ok(handler);
  await handler?.({
    from: {},
    message: { text: "/link CODE1234" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.equal(replies[0], "Unable to read Telegram profile ID. Please retry.");
});

test("/link command returns fallback message on API failure", async () => {
  const bot = createBotMock();
  registerLinkHandler(
    bot as never,
    {
      apiClient: {
        linkTelegram: async () => {
          throw new Error("api_down");
        }
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("link");
  assert.ok(handler);
  await handler?.({
    from: { id: 123 },
    message: { text: "/link CODE1234" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.equal(replies[0], "Unable to link account. Verify one-time code and retry.");
});

test("/status command handles missing telegram user id", async () => {
  const bot = createBotMock();
  registerStatusHandler(
    bot as never,
    {
      apiClient: {
        status: async () => ({ connected: true, message: "ok" })
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("status");
  assert.ok(handler);
  await handler?.({
    from: {},
    message: { text: "/status" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.equal(replies[0], "Unable to read Telegram profile ID.");
});

test("/status command returns fallback on API error", async () => {
  const bot = createBotMock();
  registerStatusHandler(
    bot as never,
    {
      apiClient: {
        status: async () => {
          throw new Error("api_down");
        }
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("status");
  assert.ok(handler);
  await handler?.({
    from: { id: 123 },
    message: { text: "/status" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.equal(replies[0], "Status service is temporarily unavailable.");
});

test("/diagnostics command handles missing telegram user id", async () => {
  const bot = createBotMock();
  registerDiagnosticsHandler(
    bot as never,
    {
      apiClient: {
        diagnostics: async () => ({ summary: "ok", nextActions: [] })
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("diagnostics");
  assert.ok(handler);
  await handler?.({
    from: {},
    message: { text: "/diagnostics" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.equal(replies[0], "Unable to read Telegram profile ID.");
});

test("/diagnostics command returns fallback on API error", async () => {
  const bot = createBotMock();
  registerDiagnosticsHandler(
    bot as never,
    {
      apiClient: {
        diagnostics: async () => {
          throw new Error("api_down");
        }
      }
    } as never
  );

  const replies: string[] = [];
  const handler = bot.handlers.get("diagnostics");
  assert.ok(handler);
  await handler?.({
    from: { id: 123 },
    message: { text: "/diagnostics" },
    reply: async (text: string) => {
      replies.push(text);
    }
  });

  assert.equal(replies[0], "Diagnostics service is temporarily unavailable.");
});
