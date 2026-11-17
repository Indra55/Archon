import { getGithubAuthUrl } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const joinCode = request.nextUrl.searchParams.get("join_code") || undefined;
  return NextResponse.redirect(getGithubAuthUrl(joinCode));
}
