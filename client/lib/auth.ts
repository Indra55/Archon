/**
 * GitHub OAuth configuration and utilities
 */

export const GITHUB_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "",
  clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
  scope: "user:email read:org",
};

export const getGithubAuthUrl = (joinCode?: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";
  const base = `${backendUrl}/auth/github`;
  if (joinCode) {
    return `${base}?join_code=${encodeURIComponent(joinCode)}`;
  }
  return base;
};

export interface KachowUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  kachow_role: "admin" | "engineer" | "viewer";
  github_username: string;
  org_id: string;
  auth_provider: string;
}

export interface UserSession {
  user: {
    id: string;
    login: string;
    name: string;
    avatar_url: string;
    email: string;
  };
  expiresAt: number;
}

export interface OrgStatus {
  configured: boolean;
  org?: {
    id: string;
    org_name: string;
    github_org_slug: string;
    created_at: string;
  };
}

export interface OnboardingData {
  completed: boolean;
  preferences?: {
    language: string;
    codebaseSize: string;
    primaryLanguage: string;
  };
}
