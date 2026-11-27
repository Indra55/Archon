import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.ARCHON_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// DELETE /api/admin/users/[id] — deactivate user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await fetch(
            `${BACKEND_URL}/api/v1/admin/users/${id}`,
            {
                method: "DELETE",
                headers: { Cookie: `token=${token}` },
            }
        );
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 });
    }
}
