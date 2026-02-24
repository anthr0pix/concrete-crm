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

  if (payload.type !== "quote") {
    return NextResponse.json({ error: "This link is not for a quote." }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: payload.id },
      include: { customer: true },
    });
    if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    if (!quote.depositAmount) return NextResponse.json({ error: "No deposit required for this quote." }, { status: 400 });
    if (quote.depositPaid) return NextResponse.json({ error: "Deposit has already been paid." }, { status: 409 });

    // Calculate actual deposit amount
    const depositDollars =
      quote.depositType === "PERCENTAGE"
        ? quote.total * quote.depositAmount / 100
        : quote.depositAmount;

    const square = getSquareClient();
    const response = await square.checkout.paymentLinks.create({
      order: {
        locationId: getLocationId(),
        lineItems: [{
          name: `Deposit for Quote ${quote.quoteNumber}`,
          quantity: "1",
          basePriceMoney: {
            amount: BigInt(Math.round(depositDollars * 100)),
            currency: "USD",
          },
        }],
      },
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${token}/payment-success`,
      },
      prePopulatedData: {
        buyerEmail: quote.customer.email || undefined,
      },
    });

    // Create a pending PaymentEvent to track
    const orderId = response.paymentLink?.orderId;
    await prisma.paymentEvent.create({
      data: {
        quoteId: quote.id,
        squareOrderId: orderId || null,
        eventType: "deposit.created",
        amount: depositDollars,
        status: "PENDING",
      },
    });

    return NextResponse.json({ url: response.paymentLink?.url });
  } catch (err) {
    console.error("[portal/deposit]", err);
    return NextResponse.json({ error: "Failed to create deposit payment link." }, { status: 500 });
  }
}
