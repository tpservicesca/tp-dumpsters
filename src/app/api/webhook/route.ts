import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/calendar";
import { sendSMS } from "@/lib/twilio";
import { notifyAdminsTelegram } from "@/lib/telegram";
import * as mysql from "mysql2/promise";
import * as fs from "fs";
import * as crypto from "crypto";

// Type codes mapping (service name → short code for calendar summary)
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

function getDbConfig() {
  return {
    host: "127.0.0.1",
    user: "u781187371_cristoferdeita",
    password: "Locomen50.",
    database: "u781187371_DumspterBookin",
  };
}

function getWebhookSecret(): string | null {
  try {
    const keys = JSON.parse(fs.readFileSync("/home/u781187371/stripe-keys.json", "utf8"));
    return keys.webhook_secret || null;
  } catch {
    return null;
  }
}

function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  const parts = sigHeader.split(",").reduce((acc, part) => {
    const [key, val] = part.split("=");
    acc[key.trim()] = val;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  // Reject if timestamp is older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const SUPABASE_URL = "https://mbirzaocjkhqydtuqmze.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaXJ6YW9jamtocXlkdHVxbXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2OTE1NSwiZXhwIjoyMDkxMTQ1MTU1fQ.YHwCnfucB1eQN-yb7iNPp16bot_tzDkNdRPHLQb7Cqs";

type Classification = {
  base_price: number;
  extra_days_fee: number;
  overweight_fee: number;
  special_items_fee: number;
  discount: number;
  dumpsterCount: number;
};

function classifyInvoiceLines(lines: Array<{ description?: string | null; amount?: number; quantity?: number }>): Classification {
  const c: Classification = {
    base_price: 0,
    extra_days_fee: 0,
    overweight_fee: 0,
    special_items_fee: 0,
    discount: 0,
    dumpsterCount: 0,
  };
  for (const line of lines) {
    const desc = (line.description || "").toLowerCase();
    const amt = (line.amount || 0) / 100;
    const qty = line.quantity || 1;
    if (amt < 0) {
      c.discount += -amt;
      continue;
    }
    if (desc.includes("extra day") || desc.includes("extra days")) {
      c.extra_days_fee += amt;
    } else if (desc.includes("extra weight") || desc.includes("overweight") || desc.includes("sobrepeso")) {
      c.overweight_fee += amt;
    } else if (desc.includes("loading machine") || desc.includes("loading") || desc.includes("handling") || desc.includes("multa") || desc.includes("penalty") || desc.includes("fee")) {
      c.special_items_fee += amt;
    } else if (desc.includes("mattress") || desc.includes("appliance") || desc.includes("tire") || desc.includes("electronic") || desc.includes("special item")) {
      c.special_items_fee += amt;
    } else if (desc.includes("dumpster") || desc.includes("yard") || desc.includes("rental")) {
      c.base_price += amt;
      c.dumpsterCount += qty;
    } else {
      // Unclassified — treat as base to not lose revenue
      c.base_price += amt;
    }
  }
  return c;
}

async function handleInvoicePaid(event: { data?: { object?: Record<string, unknown> } }) {
  try {
    const inv = event.data?.object as Record<string, unknown> | undefined;
    if (!inv) return NextResponse.json({ received: true, error: "no invoice" });

    const invoiceId = inv.id as string;
    const customerId = inv.customer as string | null;
    const amountPaid = ((inv.amount_paid as number) || 0) / 100;
    const paidAt = ((inv.status_transitions as Record<string, unknown> | undefined)?.paid_at as number) || ((inv.created as number) || 0);

    // Read line items from the invoice
    const linesObj = inv.lines as { data?: Array<{ description?: string | null; amount?: number; quantity?: number }> } | undefined;
    const lines = linesObj?.data || [];
    const cls = classifyInvoiceLines(lines);

    // Resolve customer name — Stripe may have it on invoice.customer_name or we fetch the customer
    let customerName = (inv.customer_name as string) || "";
    if (!customerName && customerId) {
      const stripeKeys = JSON.parse(fs.readFileSync("/home/u781187371/stripe-keys.json", "utf8"));
      const auth = Buffer.from(`${stripeKeys.secret_key}:`).toString("base64");
      const cRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (cRes.ok) {
        const c = await cRes.json();
        customerName = c.name || "";
      }
    }

    const firstName = (customerName.split(" ")[0] || "").toLowerCase();
    if (!firstName) {
      await notifyAdminsTelegram(`⚠️ Stripe invoice ${invoiceId} pagada $${amountPaid} sin nombre de cliente. Revisar manual.`);
      return NextResponse.json({ received: true, warning: "no customer name" });
    }

    // Match bookings in Supabase: first name + scheduled_date within ±30 days of paid_at
    const paidDate = new Date(paidAt * 1000).toISOString().slice(0, 10);
    const dMin = new Date(Date.parse(paidDate) - 30 * 86400000).toISOString().slice(0, 10);
    const dMax = new Date(Date.parse(paidDate) + 30 * 86400000).toISOString().slice(0, 10);

    // Guard: ilike on a 1-2 char name matches too many bookings (a single "S" would hit 27 rows).
    // Pick the most selective name part: skip short pieces (1-2 chars) and business suffixes
    // (LLC, Inc, Co, Corp, Entreprises) and settle on the longest remaining token.
    const STOP_WORDS = new Set(["llc", "inc", "co", "corp", "corporation", "entreprises", "enterprises", "ltd", "lp", "services", "service"]);
    const tokens = customerName
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => t.toLowerCase())
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
    // Prefer the longest remaining token (most specific)
    tokens.sort((a, b) => b.length - a.length);
    const matchName = tokens[0] || firstName;
    const nameFilter = `customer_name=ilike.*${encodeURIComponent(matchName)}*`;

    const matchUrl =
      `${SUPABASE_URL}/rest/v1/bookings?select=id,booking_number,customer_name,scheduled_date,base_price,extra_days_fee,overweight_fee,special_items_fee,discount,status` +
      `&${nameFilter}` +
      `&scheduled_date=gte.${dMin}&scheduled_date=lte.${dMax}`;
    const matchRes = await fetch(matchUrl, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    const matches = (await matchRes.json()) as Array<Record<string, unknown>>;

    if (!matches.length) {
      await notifyAdminsTelegram(
        `💳 Stripe invoice ${invoiceId} pagada $${amountPaid} de ${customerName} — no hay booking en la app. ¿Era un servicio no registrado?`
      );
      return NextResponse.json({ received: true, warning: "no match", customerName });
    }

    if (matches.length === 1) {
      // Single match: apply classification directly
      const b = matches[0];
      const updateBody = {
        base_price: cls.base_price || b.base_price,
        extra_days_fee: cls.extra_days_fee,
        overweight_fee: cls.overweight_fee,
        special_items_fee: cls.special_items_fee,
        discount: cls.discount,
        notes: `Auto-sync from Stripe invoice ${invoiceId} paid $${amountPaid} on ${paidDate}`,
      };
      await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${b.id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateBody),
      });
      await notifyAdminsTelegram(
        `💰 Pago recibido: ${customerName} $${amountPaid} → booking ${b.booking_number} actualizado ✓`
      );
      return NextResponse.json({ received: true, matched: b.booking_number, classification: cls });
    }

    // Multiple matches → alert admin for manual resolution
    const match_numbers = matches.map((m) => m.booking_number).join(", ");
    await notifyAdminsTelegram(
      `⚠️ Stripe invoice ${invoiceId} pagada $${amountPaid} de ${customerName} — ${matches.length} bookings coinciden (${match_numbers}). Necesito que Asaí me diga a cuál aplicar.`
    );
    return NextResponse.json({ received: true, ambiguous: matches.length, matches: match_numbers });
  } catch (err) {
    console.error("❌ handleInvoicePaid error:", err);
    return NextResponse.json({ received: true, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify Stripe webhook signature
    const rawBody = await req.text();
    const sigHeader = req.headers.get("stripe-signature") || "";
    const webhookSecret = getWebhookSecret();

    if (webhookSecret) {
      if (!verifyStripeSignature(rawBody, sigHeader, webhookSecret)) {
        console.error("❌ Webhook: Invalid Stripe signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
      console.log("✅ Webhook: Stripe signature verified");
    } else {
      console.warn("⚠️ Webhook: No webhook secret configured, skipping verification");
    }

    const event = JSON.parse(rawBody);

    // Manual-invoice flow — Asaí creates invoices in Stripe Dashboard and client pays them.
    // We read the line items and update the matching booking in Supabase.
    if (event.type === "invoice.payment_succeeded") {
      return await handleInvoicePaid(event);
    }

    // Only handle checkout.session.completed for the online booking flow
    if (event.type !== "checkout.session.completed") {
      console.log(`⏭️ Webhook: ignoring event type ${event.type}`);
      return NextResponse.json({ received: true, ignored: true });
    }

    const session = event.data?.object;
    if (!session?.metadata) {
      console.error("⚠️ Webhook: no metadata in session");
      return NextResponse.json({ received: true, error: "no metadata" });
    }

    const meta = session.metadata;
    const bookingId = meta.booking_id;
    const customerName = meta.customer_name;
    const customerPhone = meta.customer_phone;
    const customerEmail = session.customer_details?.email || "";
    const serviceType = meta.service_type;
    const dumpsterSize = meta.dumpster_size;
    const deliveryDate = meta.delivery_date;
    const pickupDate = meta.pickup_date;
    const address = meta.address;
    const city = meta.city;
    const zipCode = meta.zip_code;
    const deliveryWindow = meta.delivery_window || "";

    // Map delivery windows to start/end times
    const WINDOWS: Record<string, { start: string; end: string; label: string }> = {
      morning: { start: "07:00:00", end: "11:00:00", label: "Morning (7AM-11AM)" },
      midday: { start: "11:00:00", end: "15:00:00", label: "Midday (11AM-3PM)" },
      afternoon: { start: "15:00:00", end: "19:00:00", label: "Afternoon (3PM-7PM)" },
    };
    const windowInfo = WINDOWS[deliveryWindow];
    const totalPaid = session.amount_total
      ? `$${(session.amount_total / 100).toFixed(2)}`
      : "N/A";

    console.log(
      `💰 PAYMENT RECEIVED: ${bookingId} | ${customerName} | ${serviceType} ${dumpsterSize} | ${totalPaid}`
    );

    // Build type code for calendar summary
    const typeCode = TYPE_CODES[serviceType] || "GD";
    const fullAddress = [address, city, zipCode].filter(Boolean).join(", ");

    const eventDescription = `Phone: ${customerPhone}`;

    // 1. Update booking status in MySQL
    let dbUpdated = false;
    try {
      const conn = await mysql.createConnection(getDbConfig());
      await conn.execute(
        "UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE booking_id = ?",
        [bookingId]
      );
      await conn.end();
      dbUpdated = true;
      console.log(`✅ DB: Booking ${bookingId} status → confirmed`);
    } catch (dbErr) {
      console.error("❌ DB update error:", dbErr);
    }

    // 2. Create delivery calendar event (timed if window selected, otherwise all-day)
    const deliverySummary = `${customerName} ${dumpsterSize}${typeCode}delivery`;
    const deliveryResult = await createCalendarEvent({
      summary: deliverySummary,
      date: deliveryDate,
      description: eventDescription,
      location: fullAddress,
      colorId: "10", // green for delivery
      ...(windowInfo ? { startTime: windowInfo.start, endTime: windowInfo.end } : {}),
    });

    // 3. Create pickup calendar event — TIMED (same window as delivery)
    const pickupSummary = `${customerName} ${dumpsterSize}${typeCode}pickup`;
    const pickupWindow = windowInfo || WINDOWS.morning;
    const pickupResult = await createCalendarEvent({
      summary: pickupSummary,
      date: pickupDate,
      description: eventDescription,
      location: fullAddress,
      colorId: "11", // red for pickup
      startTime: pickupWindow.start,
      endTime: pickupWindow.end,
    });

    console.log(
      `📅 Calendar events: delivery=${deliveryResult.success ? deliveryResult.eventId : "FAILED"}, pickup=${pickupResult.success ? pickupResult.eventId : "FAILED"}`
    );

    // Send booking confirmation SMS (non-blocking — failures don't affect response)
    let smsSent = false;
    if (customerPhone) {
      try {
        const windowLabels: Record<string, string> = {
          morning: "7:00 AM - 11:00 AM",
          midday: "11:00 AM - 3:00 PM",
          afternoon: "3:00 PM - 7:00 PM",
        };
        const deliveryWindowMeta = meta.delivery_window || "";
        const windowLabel = windowLabels[deliveryWindowMeta] || "7:00 AM - 5:00 PM";

        const formattedDate = new Date(deliveryDate + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "short", month: "short", day: "numeric",
        });

        const smsBody = `Hi ${customerName.split(" ")[0]}! Your dumpster rental is confirmed ✅\n\n` +
          `📋 Booking: ${bookingId}\n` +
          `🗑️ ${serviceType} - ${dumpsterSize} Yard\n` +
          `📦 Delivery: ${formattedDate} (${windowLabel})\n` +
          `📍 ${fullAddress}\n\n` +
          `Questions? Call (510) 650-2083\n` +
          `— TP Dumpsters`;

        const smsResult = await sendSMS(customerPhone, smsBody);
        smsSent = smsResult.success;
        console.log(`📱 Confirmation SMS: ${smsResult.success ? "sent" : "failed"}`);
      } catch (smsErr) {
        console.error("📱 SMS error (non-blocking):", smsErr);
      }
    }

    // Notify admins (Cristofer + Asaí) of the paid booking — Telegram + SMS
    const windowLabel = windowInfo?.label || "TBD";
    // Format delivery date for humans: "Mon Apr 27" instead of "2026-04-27"
    const deliveryDateLabel = deliveryDate
      ? new Date(deliveryDate + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "";
    const adminTelegram =
      `💰 *New booking paid — ${totalPaid}*\n\n` +
      `👤 ${customerName}${customerPhone ? ` — ${customerPhone}` : ""}\n` +
      `🗑️ ${dumpsterSize}yd ${serviceType}\n` +
      `📦 ${deliveryDateLabel || deliveryDate} — ${windowLabel}\n` +
      `📍 ${fullAddress}\n` +
      `📋 ${bookingId}`;

    await notifyAdminsTelegram(adminTelegram);

    // 5. Forward confirmed booking to Dumpsterin
    let dumpsterinSynced = false;
    try {
      const dumpsterinRes = await fetch("https://mbirzaocjkhqydtuqmze.supabase.co/functions/v1/webhook-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": "tp-dumpsters-webhook-2026",
        },
        body: JSON.stringify({
          bookingId,
          customerName,
          customerPhone,
          customerEmail,
          service: { serviceType, size: dumpsterSize, basePrice: session.amount_total ? session.amount_total / 100 : 0 },
          deliveryDate,
          pickupDate,
          deliveryWindow,
          address,
          city,
          zipCode,
          totalPrice: session.amount_total ? session.amount_total / 100 : 0,
          notes: `Paid online via Stripe | ${totalPaid}`,
        }),
      });
      dumpsterinSynced = dumpsterinRes.ok;
      console.log(`🔗 Dumpsterin sync: ${dumpsterinSynced ? "success" : "failed"}`);
    } catch (dumpErr) {
      console.error("🔗 Dumpsterin sync error:", dumpErr);
    }

    return NextResponse.json({
      received: true,
      bookingId,
      dbUpdated,
      calendarEvents: {
        delivery: deliveryResult,
        pickup: pickupResult,
      },
      smsSent,
      dumpsterinSynced,
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
