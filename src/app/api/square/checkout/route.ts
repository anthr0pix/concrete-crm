import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSquareClient, getLocationId } from "@/lib/square";

export async function POST(req: NextRequest) {
  let body: { invoiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { invoiceId } = body;
  if (!invoiceId || typeof invoiceId !== "string") {
    return NextResponse.json(
      { error: "invoiceId is required" },
      { status: 400 }
    );
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID" || invoice.status === "VOID") {
      return NextResponse.json(
        { error: `Invoice is already ${invoice.status.toLowerCase()}` },
        { status: 422 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://app.mountainwestsurface.com";

    const square = getSquareClient();
    const response = await square.checkout.paymentLinks.create({
      order: {
        locationId: getLocationId(),
        lineItems: [
          {
            name: `Invoice ${invoice.invoiceNumber}`,
            quantity: "1",
            basePriceMoney: {
              amount: BigInt(Math.round(invoice.total * 100)),
              currency: "USD",
            },
          },
        ],
      },
      checkoutOptions: {
        redirectUrl: `${appUrl}/portal/payment-success?type=invoice&id=${invoice.id}`,
      },
      prePopulatedData: {
        buyerEmail: invoice.customer.email || undefined,
      },
    });

    const paymentLinkUrl = response.paymentLink?.url;
    if (!paymentLinkUrl) {
      console.error("[square/checkout] No payment link URL returned:", response);
      return NextResponse.json(
        { error: "Failed to create payment link" },
        { status: 502 }
      );
    }

    // Create a PaymentEvent for tracking
    const orderId = response.paymentLink?.orderId ?? null;
    await prisma.paymentEvent.create({
      data: {
        invoiceId: invoice.id,
        squareOrderId: orderId,
        eventType: "checkout.created",
        amount: invoice.total,
        currency: "USD",
        status: "PENDING",
      },
    });

    // Store the Square order ID on the invoice for webhook matching
    if (orderId) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { squareOrderId: orderId },
      });
    }

    return NextResponse.json({ url: paymentLinkUrl });
  } catch (err) {
    console.error("[square/checkout] unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
