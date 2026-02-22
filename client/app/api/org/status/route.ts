import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// GET /api/org/status — proxy to backend
export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/org/status`, {
            cache: "no-store",
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("Failed to check org status:", err);
        return NextResponse.json({ error: "Failed to check org status" }, { status: 500 });
    }
}

// POST /api/org/status — handle setup (proxied to /api/v1/org/setup)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${BACKEND_URL}/api/v1/org/setup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        // Forward set-cookie header from backend
        const res = NextResponse.json(data, { status: response.status });
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) {
            res.headers.set("set-cookie", setCookie);
        }

        return res;
    } catch (err) {
        console.error("Failed to setup org:", err);
        return NextResponse.json({ error: "Failed to setup org" }, { status: 500 });
    }
}
