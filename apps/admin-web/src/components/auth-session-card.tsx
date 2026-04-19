"use client";

import { useState } from "react";

type AuthSessionCardProps = {
  onAuthenticated: (csrfToken: string) => void;
};

export function AuthSessionCard({ onAuthenticated }: AuthSessionCardProps): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const login = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });
      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`);
      }
      const payload = (await response.json()) as { csrfToken?: string };
      if (!payload.csrfToken) {
        throw new Error("Missing CSRF token in login response");
      }
      onAuthenticated(payload.csrfToken);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card">
      <h2 className="title">User Session</h2>
      <p className="hint">Login to issue Telegram one-time linking codes from your cabinet session.</p>

      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="user@example.com"
      />

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Your password"
      />

      <button type="button" onClick={() => void login()} disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>

      {error ? <div className="error">{error}</div> : null}
    </section>
  );
}
