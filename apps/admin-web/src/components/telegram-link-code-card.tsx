"use client";

import { useState } from "react";

type LinkCodeResponse = {
  code: string;
  expiresAt: string;
};

type LinkCodeErrorResponse = {
  error?: string;
};

type TelegramLinkCodeCardProps = {
  isAuthenticated: boolean;
  csrfToken: string | null;
  onUnauthorized: () => void;
};

export function TelegramLinkCodeCard({
  isAuthenticated,
  csrfToken,
  onUnauthorized
}: TelegramLinkCodeCardProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LinkCodeResponse | null>(null);

  const issueLinkCode = async (): Promise<void> => {
    if (!isAuthenticated) {
      setError("Please sign in first.");
      return;
    }
    if (!csrfToken) {
      setError("Session security token is missing. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/telegram/link-code", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken
        }
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as LinkCodeErrorResponse;
        if (response.status === 401) {
          onUnauthorized();
        }
        throw new Error(mapIssueError(response.status, body.error));
      }

      const payload = (await response.json()) as LinkCodeResponse;
      setResult(payload);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to issue link code";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card">
      <h2 className="title">Telegram Linking</h2>
      <p className="hint">
        Generate one-time code from your active session, then send it to bot with <code>/link YOUR_CODE</code>.
      </p>

      <button type="button" onClick={() => void issueLinkCode()} disabled={isSubmitting}>
        {isSubmitting ? "Generating..." : "Generate Link Code"}
      </button>

      {result ? (
        <div className="result">
          <div>
            <strong>Code:</strong> {result.code}
          </div>
          <div>
            <strong>Expires At:</strong> {new Date(result.expiresAt).toLocaleString()}
          </div>
        </div>
      ) : null}

      {error ? <div className="error">{error}</div> : null}
    </section>
  );
}

function mapIssueError(status: number, errorCode?: string): string {
  if (status === 401 || errorCode === "session_expired") {
    return "Session expired. Please sign in again and retry.";
  }
  if (errorCode === "api_unavailable" || status >= 500) {
    return "Service is temporarily unavailable. Please retry in a minute.";
  }
  if (errorCode === "link_code_issue_failed") {
    return "Unable to issue Telegram code for this profile. Please contact support.";
  }
  return `Unexpected error (${status}). Please retry.`;
}
