import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/calendar";

const SUPABASE_URL = "https://mbirzaocjkhqydtuqmze.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaXJ6YW9jamtocXlkdHVxbXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2OTE1NSwiZXhwIjoyMDkxMTQ1MTU1fQ.YHwCnfucB1eQN-yb7iNPp16bot_tzDkNdRPHLQb7Cqs";

const PUSH_SECRET = "tp-dumpsters-calpush-2026";

const TYPE_CODES: Record<string, string> = {
  "General Debris": "GD",
  "Household Clean Out": "HJ",
  "Construction Debris": "CD",
  "Roofing": "RF",
  "Green Waste": "GW",
  "Clean Soil": "CS",
  "Clean Concrete": "CC",
  "Mixed Materials": "MM",
};

const WINDOWS: Record<string, { start: string; end: string }> = {
  morning: { start: "07:00:00", end: "11:00:00" },
  midday: { start: "11:00:00", end: "15:00:00" },
  afternoon: { start: "15:00:00", end: "19:00:00" },
};

type Booking = {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  dumpster_size?: number;
  service_type?: string;
  scheduled_date?: string;
  pickup_date?: string | null;
  delivery_window?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  calendar_delivery_id?: string | null;
  calendar_pickup_id?: string | null;
};

function buildSummaryAndLocation(b: Booking) {
  const typeCode = TYPE_CODES[b.service_type || ""] || "GD";
  const fullAddress = [b.address, b.city, b.zip].filter(Boolean).join(", ");
  const description = b.customer_phone ? `Phone: ${b.customer_phone}` : "";
  const deliverySummary = `${b.customer_name || "Booking"} ${b.dumpster_size || "?"}${typeCode}delivery`;
  const pickupSummary = `${b.customer_name || "Booking"} ${b.dumpster_size || "?"}${typeCode}pickup`;
  return { typeCode, fullAddress, description, deliverySummary, pickupSummary };
}

async function patchSupabaseBooking(id: string, fields: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(fields),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-calendar-push-secret");
  if (secret !== PUSH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { op, booking } = (await req.json()) as { op: "create" | "update" | "delete"; booking: Booking };
  if (!op || !booking?.id) {
    return NextResponse.json({ error: "missing op or booking.id" }, { status: 400 });
  }

  // DELETE — remove both events from Calendar
  if (op === "delete") {
    const results: Record<string, unknown> = {};
    if (booking.calendar_delivery_id) {
      results.delivery = await deleteCalendarEvent(booking.calendar_delivery_id);
    }
    if (booking.calendar_pickup_id) {
      results.pickup = await deleteCalendarEvent(booking.calendar_pickup_id);
    }
    return NextResponse.json({ ok: true, op, results });
  }

  // CREATE / UPDATE both share the same payload-building logic
  const { fullAddress, description, deliverySummary, pickupSummary } = buildSummaryAndLocation(booking);
  const windowInfo = booking.delivery_window ? WINDOWS[booking.delivery_window] : undefined;
  const deliveryDate = booking.scheduled_date;
  const pickupDate = booking.pickup_date;

  if (!deliveryDate) {
    return NextResponse.json({ error: "scheduled_date required" }, { status: 400 });
  }

  const fieldsToPatch: Record<string, unknown> = {};

  // Delivery event
  if (booking.calendar_delivery_id && op === "update") {
    const r = await updateCalendarEvent(booking.calendar_delivery_id, {
      summary: deliverySummary,
      description,
      location: fullAddress,
      date: deliveryDate,
      ...(windowInfo ? { startTime: windowInfo.start, endTime: windowInfo.end } : {}),
    });
    if (!r.success) console.error("delivery update failed:", r.error);
  } else {
    const r = await createCalendarEvent({
      summary: deliverySummary,
      date: deliveryDate,
      description,
      location: fullAddress,
      colorId: "10",
      ...(windowInfo ? { startTime: windowInfo.start, endTime: windowInfo.end } : {}),
    });
    if (r.success && r.eventId) fieldsToPatch.calendar_delivery_id = r.eventId;
  }

  // Pickup event (uses same window as delivery if set, else morning)
  const pickupWindow = windowInfo || WINDOWS.morning;
  if (pickupDate) {
    if (booking.calendar_pickup_id && op === "update") {
      const r = await updateCalendarEvent(booking.calendar_pickup_id, {
        summary: pickupSummary,
        description,
        location: fullAddress,
        date: pickupDate,
        startTime: pickupWindow.start,
        endTime: pickupWindow.end,
      });
      if (!r.success) console.error("pickup update failed:", r.error);
    } else {
      const r = await createCalendarEvent({
        summary: pickupSummary,
        date: pickupDate,
        description,
        location: fullAddress,
        colorId: "11",
        startTime: pickupWindow.start,
        endTime: pickupWindow.end,
      });
      if (r.success && r.eventId) fieldsToPatch.calendar_pickup_id = r.eventId;
    }
  }

  if (Object.keys(fieldsToPatch).length > 0) {
    await patchSupabaseBooking(booking.id, fieldsToPatch);
  }

  return NextResponse.json({ ok: true, op, patched: fieldsToPatch });
}
