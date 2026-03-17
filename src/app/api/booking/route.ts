import { NextResponse } from "next/server";

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

    const bookingRecord = {
      id: bookingId,
      ...booking,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // TODO: Save to Supabase when configured
    // For now, log it
    console.log("NEW BOOKING:", JSON.stringify(bookingRecord, null, 2));

    // TODO: Send Telegram notification
    // TODO: Send email confirmation

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
