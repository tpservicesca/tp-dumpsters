import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { randomUUID } from "crypto";
import { getPool, initDB } from "@/lib/db";

let dbInitialized = false;

export async function POST(request: Request) {
  try {
    const booking = await request.json();

    // Validate required fields
    if (
      !booking.service ||
      !booking.deliveryDate ||
      !booking.pickupDate ||
      !booking.address ||
      !booking.customerName ||
      !booking.customerPhone
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate booking ID
    const bookingId = `TP-${Date.now().toString(36).toUpperCase()}`;
    const customerId = randomUUID();
    const bookingDbId = randomUUID();

    // Save booking to DB with status 'awaiting_payment'
    const db = getPool();
    if (!dbInitialized) {
      try {
        await initDB();
        dbInitialized = true;
      } catch (dbError) {
        console.error("DB init error (continuing):", dbError);
      }
    }

    try {
      await db.execute(
        "INSERT INTO customers (id, name, phone, email) VALUES (?, ?, ?, ?)",
        [customerId, booking.customerName, booking.customerPhone, booking.customerEmail || null]
      );

      await db.execute(
        `INSERT INTO bookings (id, booking_id, customer_id, service_type, dumpster_size, 
         base_price, extra_days, extra_day_fee, total_price, delivery_date, pickup_date, 
         address, city, zip_code, notes, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment')`,
        [
          bookingDbId,
          bookingId,
          customerId,
          booking.service.serviceType,
          booking.service.size,
          booking.service.basePrice,
          booking.extraDays,
          booking.extraDayFee,
          booking.totalPrice,
          booking.deliveryDate,
          booking.pickupDate,
          booking.address,
          booking.city,
          booking.zipCode,
          booking.notes || null,
        ]
      );
    } catch (dbError) {
      console.error("DB write error (continuing):", dbError);
    }

    // Build line item description
    const description = [
      `${booking.service.serviceType} - ${booking.service.size} Dumpster`,
      `Delivery: ${booking.deliveryDate}`,
      `Pickup: ${booking.pickupDate}`,
      `${booking.address}, ${booking.city}, ${booking.zipCode}`,
      booking.extraDays > 0 ? `+${booking.extraDays} extra day(s) @ $30/day` : null,
    ].filter(Boolean).join(" | ");

    // Create Stripe Checkout Session
    const origin = request.headers.get("origin") || "https://tpdumpsters.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: booking.customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Dumpster Rental - ${booking.service.serviceType} ${booking.service.size}`,
              description,
              images: ["https://tpdumpsters.com/images/hero/red-dumpster-construction.png"],
            },
            unit_amount: Math.round(booking.totalPrice * 100), // cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: bookingId,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        service_type: booking.service.serviceType,
        dumpster_size: booking.service.size,
        delivery_date: booking.deliveryDate,
        pickup_date: booking.pickupDate,
        address: booking.address,
        city: booking.city,
        zip_code: booking.zipCode,
      },
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${origin}/booking?cancelled=true`,
    });

    console.log(
      `💳 CHECKOUT: ${bookingId} | ${booking.service.serviceType} ${booking.service.size} | ${booking.customerName} | $${booking.totalPrice} | Session: ${session.id}`
    );

    return NextResponse.json({
      success: true,
      bookingId,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
