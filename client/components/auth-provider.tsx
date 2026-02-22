"use client";

import { ReactNode } from "react";

/**
 * Auth provider wrapper for the app
 * Currently a placeholder - auth state is managed via useAuth hook and API routes
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
