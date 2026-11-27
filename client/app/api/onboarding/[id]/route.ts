import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.ARCHON_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// GET /api/onboarding/[id] — Get a specific path with tasks
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/onboarding/paths/${id}`, {
            headers: { Cookie: `token=${token}` },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("Failed to fetch learning path:", err);
        return NextResponse.json({ error: "Failed to fetch learning path" }, { status: 500 });
    }
}

// PATCH /api/onboarding/[id] — Update progress
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/onboarding/paths/${id}/progress`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Cookie: `token=${token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("Failed to update progress:", err);
        return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }
}

// DELETE /api/onboarding/[id] — Delete a learning path
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/onboarding/paths/${id}`, {
            method: "DELETE",
            headers: { Cookie: `token=${token}` },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("Failed to delete learning path:", err);
        return NextResponse.json({ error: "Failed to delete learning path" }, { status: 500 });
    }
}
