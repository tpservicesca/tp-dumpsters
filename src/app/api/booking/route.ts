import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    // 1. Create or find customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .insert({
        name: booking.customerName,
        phone: booking.customerPhone,
        email: booking.customerEmail || null,
      })
      .select("id")
      .single();

    if (customerError) {
      console.error("Customer insert error:", customerError);
      return NextResponse.json(
        { error: "Failed to save customer" },
        { status: 500 }
      );
    }

    // 2. Create booking record
    const { error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_id: bookingId,
        customer_id: customer.id,
        service_type: booking.service.serviceType,
        dumpster_size: booking.service.size,
        base_price: booking.service.basePrice,
        extra_days: booking.extraDays,
        extra_day_fee: booking.extraDayFee,
        total_price: booking.totalPrice,
        delivery_date: booking.deliveryDate,
        pickup_date: booking.pickupDate,
        address: booking.address,
        city: booking.city,
        zip_code: booking.zipCode,
        notes: booking.notes || null,
        status: "pending",
      });

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      return NextResponse.json(
        { error: "Failed to save booking" },
        { status: 500 }
      );
    }

    // 3. Log for monitoring
    console.log(`✅ NEW BOOKING: ${bookingId} | ${booking.service.serviceType} ${booking.service.size} | ${booking.customerName} | ${booking.city} | $${booking.totalPrice}`);

    // TODO: Send Telegram notification to TP team
    // TODO: Send email/SMS confirmation to customer

    return NextResponse.json({
      success: true,
      bookingId,
      message: "Booking request received",
    });
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
