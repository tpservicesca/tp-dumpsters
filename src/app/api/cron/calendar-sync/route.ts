import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FN_URL = "https://mbirzaocjkhqydtuqmze.supabase.co/functions/v1/calendar-pull";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaXJ6YW9jamtocXlkdHVxbXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2OTE1NSwiZXhwIjoyMDkxMTQ1MTU1fQ.YHwCnfucB1eQN-yb7iNPp16bot_tzDkNdRPHLQb7Cqs";

export async function GET(req: NextRequest) {
  // Vercel Cron hits this endpoint with a x-vercel-cron header. In dev we allow manual invocation too.
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const manualAuth = req.nextUrl.searchParams.get("auth") === "Cantaritos1.";
  if (!isVercelCron && !manualAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(SUPABASE_FN_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    const data = await res.json();
    console.log("calendar-pull result:", data);
    return NextResponse.json({
      triggered_at: new Date().toISOString(),
      result: data,
    });
  } catch (err) {
    console.error("cron calendar-sync error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
