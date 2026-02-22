import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// POST /api/org/validate-code — proxy to backend (public)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${BACKEND_URL}/api/v1/org/validate-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("Failed to validate join code:", err);
        return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
    }
}
