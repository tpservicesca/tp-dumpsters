import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/calendar";
import { sendSMS } from "@/lib/twilio";
import { notifyAdminsTelegram } from "@/lib/telegram";
import { getStripe } from "@/lib/stripe";
import * as mysql from "mysql2/promise";

const AUTH_CODE = "Cantaritos1.";

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

function getDbConfig() {
  return {
    host: "127.0.0.1",
    user: "u781187371_cristoferdeita",
    password: "Locomen50.",
    database: "u781187371_DumspterBookin",
  };
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const auth = req.headers.get("x-dashboard-auth");
    if (auth !== AUTH_CODE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerName,
      phone,
      email,
      serviceType,
      dumpsterSize,
      address,
      city,
      zipCode,
      deliveryDate,
      deliveryWindow,
      pickupDate,
      totalPrice,
      paymentMethod,
      notes,
    } = body;

    // Validate required fields
    const missing: string[] = [];
    if (!customerName) missing.push("customerName");
    if (!phone) missing.push("phone");
    if (!serviceType) missing.push("serviceType");
    if (!dumpsterSize) missing.push("dumpsterSize");
    if (!address) missing.push("address");
    if (!city) missing.push("city");
    if (!zipCode) missing.push("zipCode");
    if (!deliveryDate) missing.push("deliveryDate");
    if (!deliveryWindow) missing.push("deliveryWindow");
    if (!pickupDate) missing.push("pickupDate");
    if (!totalPrice) missing.push("totalPrice");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate booking ID
    const bookingId = `TP-${Date.now().toString(36).toUpperCase()}`;
    const typeCode = TYPE_CODES[serviceType] || "GD";
    const size = dumpsterSize.replace("yd", "");
    const fullAddress = `${address}, ${city}, CA ${zipCode}`;

    // Save to database
    let conn: mysql.Connection | null = null;
    try {
      conn = await mysql.createConnection(getDbConfig());

      // Insert customer
      const [custResult] = await conn.execute(
        `INSERT INTO customers (name, email, phone, created_at) VALUES (?, ?, ?, NOW())`,
        [customerName, email || null, phone]
      );
      const customerId = (custResult as mysql.ResultSetHeader).insertId;

      // Insert booking
      await conn.execute(
        `INSERT INTO bookings (booking_id, customer_id, service_type, dumpster_size, address, city, zip_code, delivery_date, pickup_date, total_price, payment_method, status, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, NOW())`,
        [
          bookingId,
          customerId,
          serviceType,
          dumpsterSize,
          address,
          city,
          zipCode,
          deliveryDate,
          pickupDate,
          totalPrice,
          paymentMethod || "Other",
          notes || null,
        ]
      );

      console.log(`✅ Manual booking saved: ${bookingId} for ${customerName}`);
    } catch (dbErr) {
      console.error("DB error (continuing with calendar):", dbErr);
    } finally {
      if (conn) await conn.end();
    }

    // Create calendar events
    const window = WINDOWS[deliveryWindow] || WINDOWS.morning;

    // Delivery event (timed)
    const deliverySummary = `${customerName} ${size}${typeCode}delivery`;
    const deliveryResult = await createCalendarEvent({
      summary: deliverySummary,
      date: deliveryDate,
      description: `Phone: ${phone}${notes ? `\nNotes: ${notes}` : ""}`,
      location: fullAddress,
      colorId: "10",
      startTime: window.start,
      endTime: window.end,
    });

    // Pickup event (all-day)
    const pickupSummary = `${customerName} ${size}${typeCode}pickup`;
    const pickupResult = await createCalendarEvent({
      summary: pickupSummary,
      date: pickupDate,
      description: `Phone: ${phone}${notes ? `\nNotes: ${notes}` : ""}`,
      location: fullAddress,
      colorId: "11",
    });

    console.log(`📅 Calendar events created for ${bookingId}: delivery=${deliveryResult.eventId}, pickup=${pickupResult.eventId}`);

    // Send booking confirmation SMS (non-blocking)
    let smsSent = false;
    if (phone) {
      try {
        const windowLabels: Record<string, string> = {
          morning: "7:00 AM - 11:00 AM",
          midday: "11:00 AM - 3:00 PM",
          afternoon: "3:00 PM - 7:00 PM",
        };
        const windowLabel = windowLabels[deliveryWindow] || "7:00 AM - 5:00 PM";

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

        const smsResult = await sendSMS(phone, smsBody);
        smsSent = smsResult.success;
        console.log(`📱 Confirmation SMS: ${smsResult.success ? "sent" : "failed"}`);
      } catch (smsErr) {
        console.error("📱 SMS error (non-blocking):", smsErr);
      }
    }

    // Create Stripe invoice so everything lives in one place (no more manual invoicing from Dashboard)
    let stripeInvoiceId: string | null = null;
    let stripeInvoiceUrl: string | null = null;
    try {
      const stripe = getStripe();
      // Find existing customer by email or phone, else create
      let stripeCustomer = null;
      if (email) {
        const list = await stripe.customers.list({ email, limit: 1 });
        if (list.data.length > 0) stripeCustomer = list.data[0];
      }
      if (!stripeCustomer && phone) {
        const search = await stripe.customers.search({ query: `phone:"${phone}"`, limit: 1 });
        if (search.data.length > 0) stripeCustomer = search.data[0];
      }
      if (!stripeCustomer) {
        stripeCustomer = await stripe.customers.create({
          name: customerName,
          email: email || undefined,
          phone,
        });
      }

      // Create invoice item for the dumpster
      const sizeLabel = dumpsterSize.includes("Yard") ? dumpsterSize : `${dumpsterSize} Yard`;
      await stripe.invoiceItems.create({
        customer: stripeCustomer.id,
        amount: Math.round(Number(totalPrice) * 100),
        currency: "usd",
        description: `${sizeLabel} dumpster for ${serviceType.toLowerCase()}`,
      });

      // Create invoice (draft first, then finalize)
      const invoice = await stripe.invoices.create({
        customer: stripeCustomer.id,
        collection_method: "send_invoice",
        days_until_due: 7,
        description: `${sizeLabel} Dumpster — ${serviceType} | 7-day rental`,
        custom_fields: [{ name: "Booking ID", value: bookingId }],
        metadata: { booking_id: bookingId },
        footer: "Extra days: $49/day • Overweight: $135/ton • Mattresses: $60 • Appliances: $40 • Tires: $20\nKeep debris below fill line. No hazardous materials. 24h cancellation notice ($150 fee).\n\nThanks for choosing TP Dumpsters!",
        auto_advance: false,
        pending_invoice_items_behavior: "include",
      });
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id as string);
      stripeInvoiceId = finalized.id as string;
      stripeInvoiceUrl = finalized.hosted_invoice_url as string | null;
      console.log(`💳 Stripe invoice ${stripeInvoiceId} for ${customerName}: ${stripeInvoiceUrl}`);
    } catch (stripeErr) {
      console.error("💳 Stripe invoice error (non-blocking):", stripeErr);
    }

    // Notify admins (Cristofer + Asaí) of the new manual booking
    try {
      const adminBody =
        `New manual booking! ${customerName} - ${dumpsterSize} ${serviceType} - $${totalPrice}` +
        `${deliveryDate ? ` - Delivery ${deliveryDate}` : ""}` +
        `${paymentMethod ? ` - ${paymentMethod}` : ""}` +
        `${phone ? ` - ${phone}` : ""}` +
        (stripeInvoiceUrl ? `\n💳 Invoice: ${stripeInvoiceUrl}` : "");
      await notifyAdminsTelegram(adminBody);
    } catch (adminErr) {
      console.error("📱 Admin SMS error (non-blocking):", adminErr);
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      deliveryEventId: deliveryResult.eventId || null,
      pickupEventId: pickupResult.eventId || null,
      stripeInvoiceId,
      stripeInvoiceUrl,
      smsSent,
      calendarErrors: [
        !deliveryResult.success ? `Delivery: ${deliveryResult.error}` : null,
        !pickupResult.success ? `Pickup: ${pickupResult.error}` : null,
      ].filter(Boolean),
    });
  } catch (err) {
    console.error("Manual booking error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
