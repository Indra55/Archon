"use client";

import { useEffect, useState } from "react";
import { KachowUser, OrgStatus } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<KachowUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser({
              id: data.user.id,
              username: data.user.username,
              email: data.user.email,
              avatar: data.user.avatar,
              kachow_role: data.user.kachow_role || "engineer",
              github_username: data.user.github_username || data.user.username,
              org_id: data.user.org_id,
              auth_provider: data.user.auth_provider || "github",
            });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("[KA-CHOW] Session check failed:", err);
        setError("Failed to check session");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/login";
    } catch (err) {
      console.error("[KA-CHOW] Logout failed:", err);
      setError("Failed to logout");
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.kachow_role === "admin",
    logout,
  };
}

export function useOrgStatus() {
  const [orgStatus, setOrgStatus] = useState<OrgStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/org/status");
        if (res.ok) {
          const data = await res.json();
          setOrgStatus(data);
        }
      } catch (err) {
        console.error("[KA-CHOW] Org status check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  return { orgStatus, loading };
}
