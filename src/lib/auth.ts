import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_PASSWORD = "Cantaritos1.";

export function checkAuth(request: NextRequest): NextResponse | null {
  const auth = request.nextUrl.searchParams.get("auth");
  if (auth !== DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
