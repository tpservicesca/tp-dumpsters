import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as mysql from "mysql2/promise";

const AUTH_CODE = "Cantaritos1.";
const CALENDAR_ID = "tppaver@gmail.com";

// Service account key path on server
const SA_KEY_PATHS = [
  "/home/u781187371/google-calendar-sa.json",
  path.join(process.cwd(), "google-calendar-sa.json"),
];

// Type codes from calendar event format: "Name SizeTypeAction"
const TYPE_CODES: Record<string, string> = {
  GD: "General Debris",
  HJ: "Household Junk",
  CD: "Construction Debris",
  RF: "Roofing",
  GW: "Green Waste",
  YW: "Yard Waste",
  MM: "Mixed Materials",
  SC: "Clean Soil/Concrete",
  BK: "Brick",
  CS: "Clean Soil",
  CC: "Clean Concrete",
};

interface CalendarEvent {
  summary: string;
  date: string;
  location: string;
  customerName: string;
  size: string;
  serviceType: string;
  action: "delivery" | "pickup";
}

// Parse event summary: "Kenny 20GDdelivery" or "Rod Volz-30pickup"
function parseEventSummary(summary: string): {
  customerName: string;
  size: string;
  typeCode: string;
  action: "delivery" | "pickup";
} | null {
  // Match patterns like "Name 20GDdelivery" or "Name-30pickup" or "Name 10CSpickup"
  const match = summary.match(
    /^(.+?)[\s-]+(\d+)(GD|HJ|CD|RF|GW|YW|MM|SC|BK|CS|CC)?(delivery|pickup)$/i
  );
  if (!match) return null;

  return {
    customerName: match[1].trim(),
    size: match[2],
    typeCode: match[3]?.toUpperCase() || "GD",
    action: match[4].toLowerCase() as "delivery" | "pickup",
  };
}

async function getAccessToken(): Promise<string | null> {
  let keyData: string | null = null;

  for (const p of SA_KEY_PATHS) {
    try {
      keyData = fs.readFileSync(p, "utf8");
      break;
    } catch {
      continue;
    }
  }

  if (!keyData) return null;

  const key = JSON.parse(keyData);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const claim = Buffer.from(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const signature = crypto
    .sign("RSA-SHA256", Buffer.from(header + "." + claim), key.private_key)
    .toString("base64url");

  const jwt = header + "." + claim + "." + signature;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt,
  });

  const data = await res.json();
  return data.access_token || null;
}

async function getCalendarEvents(token: string, dateStr?: string): Promise<CalendarEvent[]> {
  const targetDate = dateStr ? new Date(dateStr + "T00:00:00-07:00") : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?` +
    new URLSearchParams({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
    });

  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });

  const data = await res.json();
  const events: CalendarEvent[] = [];

  for (const item of data.items || []) {
    if (!item.summary) continue;
    const parsed = parseEventSummary(item.summary);
    if (!parsed) continue;

    events.push({
      summary: item.summary,
      date: item.start?.dateTime || item.start?.date || "",
      location: item.location || "",
      customerName: parsed.customerName,
      size: parsed.size,
      serviceType: TYPE_CODES[parsed.typeCode] || "General Debris",
      action: parsed.action,
    });
  }

  return events;
}

function getDbConfig() {
  return {
    host: "127.0.0.1",
    user: "u781187371_cristoferdeita",
    password: "Locomen50.",
    database: "u781187371_DumspterBookin",
  };
}

async function autoAssignDumpsters(events: CalendarEvent[]) {
  let conn: mysql.Connection | null = null;
  const results: Array<{ event: string; dumpsterId: string | null; action: string; status: string }> = [];

  try {
    conn = await mysql.createConnection(getDbConfig());

    for (const event of events) {
      if (event.action === "delivery") {
        // Check if this event is already assigned (prevent duplicates)
        const [existing] = await conn.execute(
          "SELECT id FROM dumpsters WHERE customer = ? AND size = ? AND status IN ('en-route', 'deployed', 'pickup-scheduled') LIMIT 1",
          [event.customerName, event.size]
        );
        if ((existing as Array<{ id: string }>).length > 0) {
          results.push({
            event: event.summary,
            dumpsterId: (existing as Array<{ id: string }>)[0].id,
            action: "already-assigned",
            status: `ℹ️ Already assigned: ${(existing as Array<{ id: string }>)[0].id} → ${event.customerName}`,
          });
          continue;
        }

        // Find an available dumpster of the right size in yard
        const [rows] = await conn.execute(
          "SELECT id FROM dumpsters WHERE size = ? AND status = 'yard' LIMIT 1",
          [event.size]
        );

        const available = (rows as Array<{ id: string }>)[0];
        if (available) {
          // Extract city from location
          const cityMatch = event.location.match(/,\s*([^,]+),\s*CA/i);
          const city = cityMatch ? cityMatch[1].trim() : "";

          await conn.execute(
            `UPDATE dumpsters SET 
              status = 'en-route',
              customer = ?,
              address = ?,
              city = ?,
              service_type = ?,
              delivery_date = ?,
              updated_at = NOW()
            WHERE id = ?`,
            [
              event.customerName,
              event.location,
              city,
              event.serviceType,
              new Date(event.date).toISOString().split("T")[0],
              available.id,
            ]
          );

          results.push({
            event: event.summary,
            dumpsterId: available.id,
            action: "assigned-delivery",
            status: `✅ ${available.id} → ${event.customerName} (${event.location})`,
          });
        } else {
          results.push({
            event: event.summary,
            dumpsterId: null,
            action: "no-available",
            status: `⚠️ No ${event.size}yd dumpsters available in yard`,
          });
        }
      } else if (event.action === "pickup") {
        // Find the deployed dumpster for this customer
        const [rows] = await conn.execute(
          "SELECT id FROM dumpsters WHERE customer LIKE ? AND size = ? AND status IN ('deployed', 'pickup-scheduled') LIMIT 1",
          [`%${event.customerName}%`, event.size]
        );

        const deployed = (rows as Array<{ id: string }>)[0];
        if (deployed) {
          await conn.execute(
            `UPDATE dumpsters SET 
              status = 'pickup-scheduled',
              pickup_date = ?,
              updated_at = NOW()
            WHERE id = ?`,
            [new Date(event.date).toISOString().split("T")[0], deployed.id]
          );

          results.push({
            event: event.summary,
            dumpsterId: deployed.id,
            action: "scheduled-pickup",
            status: `✅ ${deployed.id} pickup scheduled for ${event.customerName}`,
          });
        } else {
          results.push({
            event: event.summary,
            dumpsterId: null,
            action: "no-match",
            status: `⚠️ No deployed ${event.size}yd dumpster found for ${event.customerName}`,
          });
        }
      }
    }
  } catch (err) {
    console.error("DB error:", err);
  } finally {
    if (conn) await conn.end();
  }

  return results;
}

// GET: View today's calendar events + current assignments
export async function GET(req: NextRequest) {
  const auth = req.nextUrl.searchParams.get("auth");
  if (auth !== AUTH_CODE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date") || undefined;

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Failed to get calendar access token" }, { status: 500 });
  }

  const events = await getCalendarEvents(token, date);

  return NextResponse.json({
    date: date || new Date().toISOString().split("T")[0],
    events,
    count: events.length,
  });
}

// POST: Sync calendar events → auto-assign dumpsters
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("x-dashboard-auth");
  if (authHeader !== AUTH_CODE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const date = body.date || undefined;

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Failed to get calendar access token" }, { status: 500 });
  }

  const events = await getCalendarEvents(token, date);
  const results = await autoAssignDumpsters(events);

  return NextResponse.json({
    synced: true,
    date: date || new Date().toISOString().split("T")[0],
    events: events.length,
    results,
  });
}
