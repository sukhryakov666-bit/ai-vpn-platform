export function parseCorsOrigins(raw?: string): string[] {
  const origins = (raw ?? "http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.includes("*")) {
    throw new Error("CORS_ORIGIN cannot include wildcard when credentials are enabled");
  }
  return origins;
}
