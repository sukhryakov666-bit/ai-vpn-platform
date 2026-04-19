export const ACCESS_TOKEN_COOKIE = "avp_access_token";
export const REFRESH_TOKEN_COOKIE = "avp_refresh_token";
export const CSRF_TOKEN_COOKIE = "avp_csrf_token";
export const ACCESS_TOKEN_MAX_AGE_SEC = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE_SEC = 30 * 24 * 60 * 60;

export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";
}

export function getSecureCookieFlag(): boolean {
  return process.env.NODE_ENV === "production";
}
