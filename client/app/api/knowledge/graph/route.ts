import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/knowledge/graph`, {
            headers: { Cookie: `token=${token}` },
            cache: "no-store",
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("Failed to fetch graph data:", err);
        return NextResponse.json({ error: "Failed to fetch graph data" }, { status: 500 });
    }
}
