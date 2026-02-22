import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// POST /api/org/join-code/regenerate — proxy to backend (admin only)
export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const response = await fetch(`${BACKEND_URL}/api/v1/org/join-code/regenerate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `token=${token}`,
            },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("Failed to regenerate join code:", err);
        return NextResponse.json({ error: "Failed to regenerate join code" }, { status: 500 });
    }
}
