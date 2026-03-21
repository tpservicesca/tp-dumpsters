import { NextRequest, NextResponse } from "next/server";
import * as mysql from "mysql2/promise";
import { sendSMS } from "@/lib/twilio";

const AUTH_CODE = "Cantaritos1.";

function getDbConfig() {
  return {
    host: "127.0.0.1",
    user: "u781187371_cristoferdeita",
    password: "Locomen50.",
    database: "u781187371_DumspterBookin",
  };
}

// GET /api/reminders?auth=Cantaritos1. — sends reminders for tomorrow's deliveries and pickups
export async function GET(req: NextRequest) {
  const auth = req.nextUrl.searchParams.get("auth");
  if (auth !== AUTH_CODE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conn = await mysql.createConnection(getDbConfig());

    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Find confirmed bookings with delivery tomorrow
    const [deliveries] = await conn.execute(
      `SELECT b.booking_id, b.delivery_date, b.dumpster_size, b.service_type, b.address, b.city,
              c.name, c.phone
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       WHERE b.delivery_date = ? AND b.status = 'confirmed' AND c.phone IS NOT NULL`,
      [tomorrowStr]
    );

    // Find confirmed bookings with pickup tomorrow
    const [pickups] = await conn.execute(
      `SELECT b.booking_id, b.pickup_date, b.dumpster_size, b.service_type, b.address, b.city,
              c.name, c.phone
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       WHERE b.pickup_date = ? AND b.status = 'confirmed' AND c.phone IS NOT NULL`,
      [tomorrowStr]
    );

    await conn.end();

    const results: Array<{ type: string; customer: string; phone: string; success: boolean }> = [];

    // Send delivery reminders
    for (const d of deliveries as any[]) {
      const formattedDate = new Date(tomorrowStr + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      });

      const body = `📦 Reminder: Your ${d.dumpster_size} yard dumpster arrives tomorrow, ${formattedDate}.\n\n` +
        `Please make sure the driveway/placement area is clear and accessible.\n\n` +
        `📍 ${d.address}${d.city ? `, ${d.city}` : ""}\n\n` +
        `Questions? Call (510) 650-2083\n` +
        `— TP Dumpsters`;

      const result = await sendSMS(d.phone, body);
      results.push({ type: "delivery", customer: d.name, phone: d.phone, success: result.success });
    }

    // Send pickup reminders
    for (const p of pickups as any[]) {
      const formattedDate = new Date(tomorrowStr + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      });

      const body = `🔄 Reminder: Your dumpster pickup is scheduled for tomorrow, ${formattedDate}.\n\n` +
        `Please make sure the dumpster is accessible for our truck.\n\n` +
        `📍 ${p.address}${p.city ? `, ${p.city}` : ""}\n\n` +
        `Need to extend? Call (510) 650-2083\n` +
        `— TP Dumpsters`;

      const result = await sendSMS(p.phone, body);
      results.push({ type: "pickup", customer: p.name, phone: p.phone, success: result.success });
    }

    return NextResponse.json({
      date: tomorrowStr,
      deliveryReminders: (deliveries as any[]).length,
      pickupReminders: (pickups as any[]).length,
      results,
    });
  } catch (err) {
    console.error("Reminder error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
