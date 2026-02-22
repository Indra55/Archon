import { cookies } from "next/headers";
import { GITHUB_CONFIG, UserSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("[v0] GitHub auth error:", error);
      redirect("/login?error=authentication_failed");
    }

    if (!code) {
      console.error("[v0] No authorization code received");
      redirect("/login?error=no_code");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CONFIG.clientId,
        client_secret: GITHUB_CONFIG.clientSecret,
        code: code,
        redirect_uri: GITHUB_CONFIG.redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("[v0] Token exchange error:", tokenData.error);
      redirect("/login?error=token_exchange_failed");
    }

    // Get user data from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error("[v0] Failed to get user data:", userData);
      redirect("/login?error=user_fetch_failed");
    }

    // Create session
    const session: UserSession = {
      user: {
        id: userData.id.toString(),
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        email: userData.email || "",
      },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    redirect("/dashboard");
  } catch (error) {
    console.error("[v0] OAuth callback error:", error);
    redirect("/login?error=callback_failed");
  }
}
