import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_session");
    cookieStore.delete("token");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[v0] Logout error:", error);
    return new Response(JSON.stringify({ error: "Logout failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
