import type { SessionOptions } from "iron-session";

/**
 * Session payload stored in the encrypted iron-session cookie.
 */
export interface SessionData {
  username: string;
  role: "caseworker" | "team_leader";
  team: string;
  lastActivity: string; // ISO timestamp
}

/**
 * iron-session configuration.
 *
 * The password must be at least 32 characters. In production this
 * MUST come from the SESSION_SECRET environment variable.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET environment variable is required in production"
      );
    }
    // Development-only fallback — never used in production
    return "dsa-allowance-dev-only-secret-key-32chars!";
  }
  return secret;
}

export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: "dsa_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
};

/**
 * 8-hour session timeout in milliseconds.
 */
export const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
