import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.ARCHON_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// POST /api/knowledge/sources/[id]/test
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    try {
        const response = await fetch(
            `${BACKEND_URL}/api/v1/knowledge/sources/${id}/test`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${token}`,
                },
                body: JSON.stringify(body),
            }
        );
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        return NextResponse.json({ error: "Failed to test connection" }, { status: 500 });
    }
}
