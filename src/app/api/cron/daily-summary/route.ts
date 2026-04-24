import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";

const SUPABASE_URL = "https://mbirzaocjkhqydtuqmze.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaXJ6YW9jamtocXlkdHVxbXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2OTE1NSwiZXhwIjoyMDkxMTQ1MTU1fQ.YHwCnfucB1eQN-yb7iNPp16bot_tzDkNdRPHLQb7Cqs";

const TELEGRAM_RECIPIENTS: Array<{ chatId: string; name: string }> = [
  { chatId: "1572834634", name: "Asaí" },
  { chatId: "8665156164", name: "Cristofer" },
];

async function tg(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function getStripeKey(): string | null {
  try {
    const keys = JSON.parse(fs.readFileSync("/home/u781187371/stripe-keys.json", "utf8"));
    return keys.secret_key || null;
  } catch {
    return process.env.STRIPE_SECRET_KEY || null;
  }
}

type Booking = {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string | null;
  address: string | null;
  dumpster_size: number | null;
  service_type: string | null;
  scheduled_date: string;
  pickup_date: string | null;
  delivery_window: string | null;
  status: string;
  base_price: number | null;
  extra_days_fee: number | null;
  overweight_fee: number | null;
  rental_days: number | null;
};

async function sbBookings(query: string): Promise<Booking[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return (await res.json()) as Booking[];
}

function fmtWindow(w: string | null): string {
  const map: Record<string, string> = {
    morning: "7-11 AM",
    midday: "11 AM-3 PM",
    afternoon: "3-7 PM",
    sameday: "Same-day",
  };
  return w ? map[w] || w : "TBD";
}

function money(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const manualAuth = req.nextUrl.searchParams.get("auth") === "Cantaritos1.";
  if (!isVercelCron && !manualAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const todayDate = new Date(today);
    const yyyy = todayDate.getFullYear();
    const mm = String(todayDate.getMonth() + 1).padStart(2, "0");
    const dd = String(todayDate.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(todayDate.getDate() + 1);
    const tomStr = tomorrow.toISOString().slice(0, 10);

    const [tomorrowDeliveries, tomorrowPickups, todayClosures] = await Promise.all([
      sbBookings(`select=*&scheduled_date=eq.${tomStr}&order=delivery_window`),
      sbBookings(`select=*&pickup_date=eq.${tomStr}&order=customer_name`),
      sbBookings(`select=*&or=(scheduled_date.eq.${todayStr},pickup_date.eq.${todayStr})&status=in.(delivered,picked_up,completed)&order=customer_name`),
    ]);

    // Anomalies
    // 1. Bookings delivered > 7 days ago still without pickup — potential extra days
    const sevenDaysAgo = new Date(todayDate);
    sevenDaysAgo.setDate(todayDate.getDate() - 7);
    const sevenStr = sevenDaysAgo.toISOString().slice(0, 10);
    const extraDaysRisk = await sbBookings(
      `select=*&status=eq.delivered&scheduled_date=lte.${sevenStr}`
    );

    // 2. Stripe drafts and open invoices
    let stripeDrafts: Array<{ id: string; customer_name: string | null; amount: number; created: Date; description: string }> = [];
    let stripeOpen: Array<{ id: string; customer_name: string | null; amount: number; created: Date }> = [];
    const stripeKey = getStripeKey();
    if (stripeKey) {
      const auth = Buffer.from(`${stripeKey}:`).toString("base64");
      const draftRes = await fetch("https://api.stripe.com/v1/invoices?status=draft&limit=20", {
        headers: { Authorization: `Basic ${auth}` },
      });
      const draftData = await draftRes.json();
      stripeDrafts = (draftData.data || []).map((i: Record<string, unknown>) => {
        const lines = ((i.lines as Record<string, unknown>)?.data || []) as Array<Record<string, unknown>>;
        const firstLine = lines[0];
        return {
          id: i.id as string,
          customer_name: (i.customer_name as string) || null,
          amount: ((i.amount_due as number) || 0) / 100,
          created: new Date(((i.created as number) || 0) * 1000),
          description: ((firstLine?.description as string) || "") + (lines.length > 1 ? ` + ${lines.length - 1} more` : ""),
        };
      });
      const openRes = await fetch("https://api.stripe.com/v1/invoices?status=open&limit=20", {
        headers: { Authorization: `Basic ${auth}` },
      });
      const openData = await openRes.json();
      stripeOpen = (openData.data || []).map((i: Record<string, unknown>) => ({
        id: i.id as string,
        customer_name: (i.customer_name as string) || null,
        amount: ((i.amount_due as number) || 0) / 100,
        created: new Date(((i.created as number) || 0) * 1000),
      }));
    }

    // Build the summary (WhatsApp format: *bold* instead of Markdown)
    const lines: string[] = [];
    lines.push(`🌙 *Resumen del día — ${todayStr}*`);
    lines.push("");

    // Tomorrow's deliveries
    lines.push(`🚛 *Mañana (${tomStr}): ${tomorrowDeliveries.length} delivery${tomorrowDeliveries.length === 1 ? "" : "s"}*`);
    if (tomorrowDeliveries.length === 0) {
      lines.push("_Nada agendado._");
    } else {
      for (const b of tomorrowDeliveries) {
        lines.push(`• ${fmtWindow(b.delivery_window)} — ${b.customer_name} ${b.dumpster_size || "?"}yd ${b.service_type || ""}`);
        if (b.address && b.address !== "Address TBD") lines.push(`    📍 ${b.address}`);
      }
    }

    // Tomorrow's pickups
    if (tomorrowPickups.length > 0) {
      lines.push("");
      lines.push(`📦 *Mañana ${tomorrowPickups.length} pickup${tomorrowPickups.length === 1 ? "" : "s"}*`);
      for (const b of tomorrowPickups) {
        lines.push(`• ${b.customer_name} ${b.dumpster_size || "?"}yd`);
      }
    }

    // Today's closures
    lines.push("");
    lines.push(`✅ *Hoy ${todayClosures.length} servicio${todayClosures.length === 1 ? "" : "s"} cerrados*`);
    for (const b of todayClosures) {
      const what = b.pickup_date === todayStr ? "pickup" : "delivery";
      lines.push(`• ${b.customer_name} ${b.dumpster_size || "?"}yd ${what}`);
    }

    // Anomalies
    if (extraDaysRisk.length > 0) {
      lines.push("");
      lines.push(`⚠️ *${extraDaysRisk.length} servicio${extraDaysRisk.length === 1 ? "" : "s"} con más de 7 días sin pickup:*`);
      for (const b of extraDaysRisk) {
        const daysOver = Math.floor((todayDate.getTime() - new Date(b.scheduled_date + "T00:00:00").getTime()) / 86400000) - 7;
        lines.push(`• ${b.customer_name} — ${daysOver} día${daysOver === 1 ? "" : "s"} extra ($${49 * daysOver})`);
      }
    }

    if (stripeDrafts.length > 0) {
      lines.push("");
      lines.push(`📝 *Stripe — ${stripeDrafts.length} draft${stripeDrafts.length === 1 ? "" : "s"} (no enviadas):*`);
      for (const d of stripeDrafts) {
        const days = Math.floor((todayDate.getTime() - d.created.getTime()) / 86400000);
        lines.push(`• ${d.customer_name || "?"} ${money(d.amount)} — ${d.description.slice(0, 40)} _(${days}d)_`);
      }
    }

    if (stripeOpen.length > 0) {
      lines.push("");
      lines.push(`💳 *Stripe — ${stripeOpen.length} invoice${stripeOpen.length === 1 ? "" : "s"} open (sin pagar):*`);
      for (const o of stripeOpen) {
        const days = Math.floor((todayDate.getTime() - o.created.getTime()) / 86400000);
        lines.push(`• ${o.customer_name || "?"} ${money(o.amount)} _(${days}d sin pagar)_`);
      }
    }

    lines.push("");
    lines.push("_— Web HTM · tpdumpsters.com/revenue_");

    const text = lines.join("\n");
    const results = await Promise.all(
      TELEGRAM_RECIPIENTS.map((r) => tg(r.chatId, text).catch(() => false))
    );

    return NextResponse.json({
      sent_to: TELEGRAM_RECIPIENTS.map((r, i) => ({ name: r.name, ok: results[i] })),
      summary_chars: text.length,
      metrics: {
        tomorrowDeliveries: tomorrowDeliveries.length,
        tomorrowPickups: tomorrowPickups.length,
        todayClosures: todayClosures.length,
        extraDaysRisk: extraDaysRisk.length,
        stripeDrafts: stripeDrafts.length,
        stripeOpen: stripeOpen.length,
      },
    });
  } catch (err) {
    console.error("daily-summary error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
