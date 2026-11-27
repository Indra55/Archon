import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.ARCHON_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// GET /api/onboarding/paths — List paths for user
export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/onboarding/paths`, {
            headers: { Cookie: `token=${token}` },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("Failed to fetch learning paths:", err);
        return NextResponse.json({ error: "Failed to fetch learning paths" }, { status: 500 });
    }
}

// POST /api/onboarding — Generate a new learning path
export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/onboarding/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `token=${token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("Failed to generate learning path:", err);
        return NextResponse.json({ error: "Failed to generate learning path" }, { status: 500 });
    }
}
