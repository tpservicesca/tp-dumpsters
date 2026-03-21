import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/calendar";
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

    // Only handle checkout.session.completed
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
    const totalPaid = session.amount_total
      ? `$${(session.amount_total / 100).toFixed(2)}`
      : "N/A";

    console.log(
      `💰 PAYMENT RECEIVED: ${bookingId} | ${customerName} | ${serviceType} ${dumpsterSize} | ${totalPaid}`
    );

    // Build type code for calendar summary
    const typeCode = TYPE_CODES[serviceType] || "GD";
    const fullAddress = [address, city, zipCode].filter(Boolean).join(", ");

    // Build description for calendar events
    const eventDescription = [
      `Booking ID: ${bookingId}`,
      `Service: ${serviceType} - ${dumpsterSize} Yard`,
      `Phone: ${customerPhone}`,
      `Email: ${customerEmail}`,
      `Total: ${totalPaid}`,
      `Address: ${fullAddress}`,
      `Booked online via tpdumpsters.com`,
    ].join("\n");

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

    // 2. Create delivery calendar event
    const deliverySummary = `${customerName} ${dumpsterSize}${typeCode}delivery`;
    const deliveryResult = await createCalendarEvent({
      summary: deliverySummary,
      date: deliveryDate,
      description: eventDescription,
      location: fullAddress,
      colorId: "10", // green for delivery
    });

    // 3. Create pickup calendar event
    const pickupSummary = `${customerName} ${dumpsterSize}${typeCode}pickup`;
    const pickupResult = await createCalendarEvent({
      summary: pickupSummary,
      date: pickupDate,
      description: eventDescription,
      location: fullAddress,
      colorId: "11", // red for pickup
    });

    console.log(
      `📅 Calendar events: delivery=${deliveryResult.success ? deliveryResult.eventId : "FAILED"}, pickup=${pickupResult.success ? pickupResult.eventId : "FAILED"}`
    );

    return NextResponse.json({
      received: true,
      bookingId,
      dbUpdated,
      calendarEvents: {
        delivery: deliveryResult,
        pickup: pickupResult,
      },
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
