import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// GET /api/projects/[id] — Get single project
// PUT /api/projects/[id] — Update project
// DELETE /api/projects/[id] — Delete project
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
        const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
            headers: { Cookie: `token=${token}` },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to fetch project" },
            { status: 500 }
        );
    }
}

export async function PUT(
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
        const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Cookie: `token=${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
}

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
        const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
            method: "DELETE",
            headers: { Cookie: `token=${token}` },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 }
        );
    }
}
