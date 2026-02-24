import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/portal-token";
import { prisma } from "@/lib/prisma";
import { getSquareClient, getLocationId } from "@/lib/square";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let payload: { type: "quote" | "invoice"; id: string };
  try {
    payload = await verifyPortalToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 401 });
  }

  if (payload.type !== "invoice") {
    return NextResponse.json({ error: "This link is not for an invoice." }, { status: 400 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: payload.id },
      include: { customer: true },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    if (invoice.status === "PAID") return NextResponse.json({ error: "Invoice already paid." }, { status: 409 });
    if (invoice.status === "VOID") return NextResponse.json({ error: "Invoice is voided." }, { status: 409 });

    const square = getSquareClient();
    const response = await square.checkout.paymentLinks.create({
      order: {
        locationId: getLocationId(),
        lineItems: [{
          name: `Invoice ${invoice.invoiceNumber}`,
          quantity: "1",
          basePriceMoney: {
            amount: BigInt(Math.round(invoice.total * 100)),
            currency: "USD",
          },
        }],
      },
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${token}/payment-success`,
      },
      prePopulatedData: {
        buyerEmail: invoice.customer.email || undefined,
      },
    });

    // Create a pending PaymentEvent to track
    const orderId = response.paymentLink?.orderId;
    await prisma.paymentEvent.create({
      data: {
        invoiceId: invoice.id,
        squareOrderId: orderId || null,
        eventType: "payment.created",
        amount: invoice.total,
        status: "PENDING",
      },
    });

    return NextResponse.json({ url: response.paymentLink?.url });
  } catch (err) {
    console.error("[portal/pay]", err);
    return NextResponse.json({ error: "Failed to create payment link." }, { status: 500 });
  }
}
