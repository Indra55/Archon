import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token?.value) {
      // Fallback check for old auth_session cookie
      const sessionCookie = cookieStore.get("auth_session");
      if (!sessionCookie?.value) {
        return new Response(JSON.stringify({ user: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const session = JSON.parse(sessionCookie.value);
      return new Response(JSON.stringify({ user: session.user }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const backendUrl = process.env.ARCHON_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";
    const response = await fetch(`${backendUrl}/auth/status`, {
      headers: {
        Cookie: `token=${token.value}`,
      },
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.authenticated) {
        // Return full user data including kachow_role, org_id etc.
        return new Response(JSON.stringify({ user: data.user }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Archon] Session check error:", error);
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
