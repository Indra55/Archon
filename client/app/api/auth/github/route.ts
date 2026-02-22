import { getGithubAuthUrl, GITHUB_CONFIG } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function GET() {
  try {
    // Validate GitHub config
    if (!GITHUB_CONFIG.clientId) {
      return new Response("GitHub Client ID not configured", { status: 500 });
    }

    const authUrl = getGithubAuthUrl();
    redirect(authUrl);
  } catch (error) {
    console.error("[v0] GitHub auth route error:", error);
    return new Response("Authentication failed", { status: 500 });
  }
}
