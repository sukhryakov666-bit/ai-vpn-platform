"use client";

import { useEffect, useState } from "react";
import { AuthSessionCard } from "../components/auth-session-card";
import { TelegramLinkCodeCard } from "../components/telegram-link-code-card";

export default function HomePage(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const loadSession = async (): Promise<void> => {
      try {
        const response = await fetch("/api/session/me");
        if (!response.ok) {
          setIsAuthenticated(false);
          return;
        }
        const payload = (await response.json()) as { authenticated?: boolean; csrfToken?: string | null };
        setIsAuthenticated(Boolean(payload.authenticated));
        setCsrfToken(payload.csrfToken ?? null);
      } catch {
        setIsAuthenticated(false);
        setCsrfToken(null);
      } finally {
        setIsCheckingSession(false);
      }
    };

    void loadSession();
  }, []);

  const signOut = async (): Promise<void> => {
    await fetch("/api/session/logout", {
      method: "POST",
      headers: csrfToken ? { "x-csrf-token": csrfToken } : {}
    });
    setIsAuthenticated(false);
    setCsrfToken(null);
  };

  return (
    <main>
      {isCheckingSession ? (
        <section className="card">
          <h2 className="title">Session Check</h2>
          <p className="hint">Checking active session...</p>
        </section>
      ) : isAuthenticated ? (
        <section className="card">
          <h2 className="title">Session Active</h2>
          <p className="hint">Authenticated session is active for Telegram link-code issuance.</p>
          <button type="button" onClick={() => void signOut()}>
            Sign Out
          </button>
        </section>
      ) : (
        <AuthSessionCard
          onAuthenticated={(token) => {
            setIsAuthenticated(true);
            setCsrfToken(token);
          }}
        />
      )}

      <TelegramLinkCodeCard
        isAuthenticated={isAuthenticated}
        csrfToken={csrfToken}
        onUnauthorized={() => {
          setIsAuthenticated(false);
          setCsrfToken(null);
        }}
      />
    </main>
  );
}
