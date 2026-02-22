import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// GET /api/onboarding/roles — Get available roles
export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/onboarding/roles`, {
            next: { revalidate: 3600 }, // Cache roles for 1 hour
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json(data);
        }
    } catch {
        // Fallback
    }

    return NextResponse.json([
        { value: "backend_engineer", label: "Backend Engineer" },
        { value: "frontend_developer", label: "Frontend Developer" },
        { value: "sre", label: "SRE" },
        { value: "fullstack_engineer", label: "Fullstack Engineer" },
        { value: "devops_engineer", label: "DevOps Engineer" },
    ]);
}
