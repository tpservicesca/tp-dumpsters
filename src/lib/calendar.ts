import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const CALENDAR_ID = "tppaver@gmail.com";

const SA_KEY_PATHS = [
  "/home/u781187371/google-calendar-sa.json",
  path.join(process.cwd(), "google-calendar-sa.json"),
];

/**
 * Gets an access token using Service Account JWT credentials.
 * Uses full calendar read/write scope.
 */
export async function getCalendarAccessToken(): Promise<string | null> {
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
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const claim = Buffer.from(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/calendar",
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

/**
 * Creates a Google Calendar all-day event.
 * Color IDs: "10" = green (delivery), "11" = red (pickup)
 */
export async function createCalendarEvent(params: {
  summary: string;
  date: string;
  description: string;
  location: string;
  colorId?: string;
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const token = await getCalendarAccessToken();
    if (!token) {
      return { success: false, error: "Failed to get calendar access token" };
    }

    // End date is next day for all-day events
    const startDate = new Date(params.date + "T00:00:00Z");
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const eventBody = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: { date: params.date },
      end: { date: endDate.toISOString().split("T")[0] },
      colorId: params.colorId || "10",
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 60 }],
      },
    };

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Calendar API error:", data);
      return { success: false, error: data.error?.message || "Calendar API error" };
    }

    console.log(`📅 Calendar event created: ${params.summary} on ${params.date} (ID: ${data.id})`);
    return { success: true, eventId: data.id };
  } catch (err) {
    console.error("Calendar event creation error:", err);
    return { success: false, error: String(err) };
  }
}
