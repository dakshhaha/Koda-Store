/**
 * NextAuth server-side session wrapper.
 * This replaces the previous custom JWT implementation with Auth.js (NextAuth v5).
 */
import { auth, signOut as nextSignOut } from "@/auth";

export const SESSION_COOKIE_NAME = "authjs.session-token"; // Default for Auth.js, or check your config

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

/**
 * Get the current session from Auth.js.
 */
export async function getSession() {
  const session = await auth();
  if (!session?.user) return null;

  return {
    userId: (session.user as any).id,
    email: session.user.email || "",
    role: (session.user as any).role || "customer",
    name: session.user.name || "",
  } as SessionPayload;
}

