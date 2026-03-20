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

    // Create or find customer
    const customer = await stripe.customers.create({
      name: customerName,
      email: customerEmail || "dumpster@tpservicesca.com",
      phone: customerPhone || undefined,
      address: billingAddress ? { line1: billingAddress } : undefined,
      shipping: { name: customerName, address: { line1: deliveryAddress } },
    });

    // Create invoice item
    const description = `${size} ${serviceType} Dumpster${dims ? ` (${dims})` : ""} — ${days}-day rental${weight ? `, ${weight} included` : ""}. Delivery: ${deliveryAddress}`;

    await stripe.invoiceItems.create({
      customer: customer.id,
      description,
      amount: unitPrice * 100,
      currency: "usd",
      quantity: qty,
    });

    // Create invoice
    const invoiceParams: Record<string, unknown> = {
      customer: customer.id,
      collection_method: "send_invoice" as const,
      days_until_due: 7,
      custom_fields: [
        { name: "Delivery Address", value: deliveryAddress.substring(0, 40) },
      ],
      footer: "Terms: Extra days $49/day | Extra weight $125/ton | Cancel: 24h notice, $150 fee | Zelle: TP PAVERS SERVICE INC 510-253-6230",
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

    console.log(`📄 INVOICE: ${finalized.id} | ${customerName} | ${serviceType} ${size} x${qty} | $${(finalized.amount_due || 0) / 100}`);

    return NextResponse.json({
      id: finalized.id,
      number: finalized.number,
      status: finalized.status,
      amount: (finalized.amount_due || 0) / 100,
      url: finalized.hosted_invoice_url,
      pdf: finalized.invoice_pdf,
      customerName,
      serviceType,
      size,
      quantity: qty,
    });
  } catch (err) {
    console.error("Invoice error:", err);
    const message = err instanceof Error ? err.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
