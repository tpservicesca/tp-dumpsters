import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

/* ───────── Service pricing ───────── */
const SERVICES: Record<string, Record<string, { price: number; dims: string; weight: string; days: number }>> = {
  "General Debris": {
    "10 Yard": { price: 649, dims: "12'L × 8'W × 2.5'H", weight: "1 ton", days: 7 },
    "20 Yard": { price: 649, dims: "16'L × 8'W × 4'H", weight: "2 tons", days: 7 },
    "30 Yard": { price: 749, dims: "16'L × 8'W × 6'H", weight: "3 tons", days: 7 },
  },
  "Household Clean Out": {
    "10 Yard": { price: 599, dims: "12'L × 8'W × 2.5'H", weight: "1 ton", days: 7 },
    "20 Yard": { price: 649, dims: "16'L × 8'W × 4'H", weight: "2 tons", days: 7 },
    "30 Yard": { price: 749, dims: "16'L × 8'W × 6'H", weight: "3 tons", days: 7 },
  },
  "Construction Debris": {
    "10 Yard": { price: 599, dims: "12'L × 8'W × 2.5'H", weight: "1 ton", days: 7 },
    "20 Yard": { price: 649, dims: "16'L × 8'W × 4'H", weight: "2 tons", days: 7 },
    "30 Yard": { price: 749, dims: "16'L × 8'W × 6'H", weight: "3 tons", days: 7 },
  },
  "Roofing": {
    "10 Yard": { price: 599, dims: "12'L × 8'W × 2.5'H", weight: "1 ton", days: 7 },
    "20 Yard": { price: 649, dims: "16'L × 8'W × 4'H", weight: "2 tons", days: 7 },
    "30 Yard": { price: 749, dims: "16'L × 8'W × 6'H", weight: "3 tons", days: 7 },
  },
  "Green Waste": {
    "10 Yard": { price: 599, dims: "12'L × 8'W × 2.5'H", weight: "1 ton", days: 7 },
    "20 Yard": { price: 649, dims: "16'L × 8'W × 4'H", weight: "2 tons", days: 7 },
    "30 Yard": { price: 749, dims: "16'L × 8'W × 6'H", weight: "3 tons", days: 7 },
  },
  "Clean Soil": {
    "10 Yard": { price: 599, dims: "12'L × 8'W × 2.5'H", weight: "No weight limit", days: 3 },
  },
  "Clean Concrete": {
    "10 Yard": { price: 599, dims: "12'L × 8'W × 2.5'H", weight: "No weight limit", days: 3 },
  },
  "Mixed Materials": {
    "10 Yard": { price: 749, dims: "12'L × 8'W × 2.5'H", weight: "No weight limit", days: 3 },
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, deliveryAddress, billingAddress, serviceType, size, quantity, notes, customPrice } = body;

    if (!customerName || !deliveryAddress || !serviceType || !size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sizeInfo = SERVICES[serviceType]?.[size];
    if (!sizeInfo && !customPrice) {
      return NextResponse.json({ error: `Unknown service/size: ${serviceType} / ${size}` }, { status: 400 });
    }

    const unitPrice = customPrice || sizeInfo!.price;
    const qty = quantity || 1;
    const dims = sizeInfo?.dims || "";
    const weight = sizeInfo?.weight || "";
    const days = sizeInfo?.days || 7;

    const stripe = getStripe();

    // Parse delivery address into components
    const addressParts = deliveryAddress.split(",").map((s: string) => s.trim());
    const shipLine1 = addressParts[0] || deliveryAddress;
    const shipCity = addressParts[1] || "";
    const shipStateZip = addressParts[2] || "";
    const shipState = shipStateZip.split(/\s+/)[0] || "";
    const shipZip = shipStateZip.split(/\s+/).slice(1).join(" ") || "";

    // Parse billing address
    const billParts = (billingAddress || deliveryAddress).split(",").map((s: string) => s.trim());
    const billLine1 = billParts[0] || "";
    const billCity = billParts[1] || "";
    const billStateZip = billParts[2] || "";
    const billState = billStateZip.split(/\s+/)[0] || "";
    const billZip = billStateZip.split(/\s+/).slice(1).join(" ") || "";

    // Create customer with full address details
    const customer = await stripe.customers.create({
      name: customerName,
      email: customerEmail || "dumpster@tpservicesca.com",
      phone: customerPhone || undefined,
      address: {
        line1: billLine1,
        city: billCity,
        state: billState,
        postal_code: billZip,
        country: "US",
      },
      shipping: {
        name: customerName,
        phone: customerPhone || undefined,
        address: {
          line1: shipLine1,
          city: shipCity,
          state: shipState,
          postal_code: shipZip,
          country: "US",
        },
      },
    });

    // Create invoice item with short description (details go in invoice note)
    const itemDescription = `${size.replace(" Yard", "-yard")} dumpster for ${serviceType.toLowerCase()}`;

    // For multiple quantities, create one line item per unit (Stripe API compatibility)
    for (let i = 0; i < qty; i++) {
      const desc = qty > 1
        ? `${itemDescription} (${i + 1} of ${qty})`
        : itemDescription;
      await stripe.invoiceItems.create({
        customer: customer.id,
        description: desc,
        amount: unitPrice * 100,
        currency: "usd",
      });
    }

    // Build detailed rental terms note
    const termsNote = [
      `RENTAL DETAILS`,
      `${size} Dumpster — ${serviceType}`,
      `Included: ${days}-day rental | Weight limit: ${weight}`,
      ``,
      `ADDITIONAL FEES`,
      `Extra days: $49/day | Overweight: $125/ton`,
      `Mattresses: $60 ea | Appliances: $40 ea | Tires: $20 ea`,
      ``,
      `RULES`,
      `Keep debris below fill line. No hazardous materials.`,
      `24h cancellation notice required ($150 fee).`,
      ``,
      `PAYMENT OPTIONS`,
      `Card: Pay using the link above`,
      `Zelle: TP PAVERS SERVICE INC — (510) 253-6230`,
    ].join("\n");

    // Create invoice with detailed terms
    const invoiceParams: Record<string, unknown> = {
      customer: customer.id,
      collection_method: "send_invoice" as const,
      days_until_due: 7,
      description: termsNote,
      custom_fields: [
        { name: "Delivery Address", value: deliveryAddress.substring(0, 40) },
      ],
      footer: "Thanks for choosing TP Dumpsters! We provide reliable, on-time service with excellent customer support across the Bay Area.",
      pending_invoice_items_behavior: "include" as const,
    };

    if (billingAddress) {
      (invoiceParams.custom_fields as Array<{name: string; value: string}>).push({
        name: "Billing Address",
        value: billingAddress.substring(0, 40),
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = await stripe.invoices.create(invoiceParams as any);

    // Finalize to get payment URL
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    // Auto-send to customer if they have a real email
    let sentEmail = false;
    if (customerEmail && customerEmail !== "dumpster@tpservicesca.com") {
      try {
        await stripe.invoices.sendInvoice(finalized.id);
        sentEmail = true;
      } catch (sendErr) {
        console.error("Failed to send invoice email:", sendErr);
      }
    }

    // Auto-send SMS with payment link if phone provided
    let sentSms = false;
    if (customerPhone) {
      try {
        // Load Twilio keys from server (not in repo)
        const fs = await import("fs");
        const twilioKeys = JSON.parse(fs.readFileSync("/home/u781187371/twilio-keys.json", "utf8"));
        const twilioSid = twilioKeys.accountSid;
        const twilioToken = twilioKeys.authToken;
        const fromNumber = twilioKeys.dumpsterNumber;
        
        // Format phone number - ensure it starts with +
        let toNumber = customerPhone.replace(/[\s()-]/g, "");
        if (!toNumber.startsWith("+")) toNumber = "+" + toNumber;

        const totalAmount = ((finalized.amount_due || 0) / 100).toFixed(2);
        const smsBody = [
          `Hi ${customerName}! 👋`,
          ``,
          `Your invoice from TP Dumpsters is ready:`,
          `🗑️ ${qty > 1 ? `${qty}x ` : ""}${size} ${serviceType}`,
          `💰 Total: $${totalAmount}`,
          ``,
          `Pay online here:`,
          `${finalized.hosted_invoice_url}`,
          ``,
          `📞 This is an automated message. For questions or customer support, call us at (510) 650-2083.`,
          `Thank you for choosing TP Dumpsters!`,
        ].join("\n");

        const params = new URLSearchParams();
        params.append("To", toNumber);
        params.append("From", fromNumber);
        params.append("Body", smsBody);

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          }
        );
        const smsResult = await twilioRes.json();
        sentSms = twilioRes.ok && !smsResult.error_code;
        if (!sentSms) console.error("SMS failed:", smsResult);
      } catch (smsErr) {
        console.error("Failed to send SMS:", smsErr);
      }
    }

    console.log(`📄 INVOICE: ${finalized.id} | ${customerName} | ${serviceType} ${size} x${qty} | $${(finalized.amount_due || 0) / 100} | Email: ${sentEmail} | SMS: ${sentSms}`);

    return NextResponse.json({
      id: finalized.id,
      number: finalized.number,
      status: finalized.status,
      amount: (finalized.amount_due || 0) / 100,
      url: finalized.hosted_invoice_url,
      pdf: finalized.invoice_pdf,
      customerName,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || null,
      serviceType,
      size,
      quantity: qty,
      sentEmail,
      sentSms,
    });
  } catch (err) {
    console.error("Invoice error:", err);
    const message = err instanceof Error ? err.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
