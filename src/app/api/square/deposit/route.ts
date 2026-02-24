import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSquareClient, getLocationId } from "@/lib/square";

export async function POST(req: NextRequest) {
  let body: { quoteId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { quoteId } = body;
  if (!quoteId || typeof quoteId !== "string") {
    return NextResponse.json(
      { error: "quoteId is required" },
      { status: 400 }
    );
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customer: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (!quote.depositAmount) {
      return NextResponse.json(
        { error: "This quote does not have a deposit configured" },
        { status: 422 }
      );
    }

    if (quote.depositPaid) {
      return NextResponse.json(
        { error: "Deposit has already been paid" },
        { status: 422 }
      );
    }

    // Calculate deposit amount based on type
    const depositAmount =
      quote.depositType === "PERCENTAGE"
        ? quote.total * quote.depositAmount / 100
        : quote.depositAmount;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://app.mountainwestsurface.com";

    const square = getSquareClient();
    const response = await square.checkout.paymentLinks.create({
      order: {
        locationId: getLocationId(),
        lineItems: [
          {
            name: `Deposit for Quote ${quote.quoteNumber}`,
            quantity: "1",
            basePriceMoney: {
              amount: BigInt(Math.round(depositAmount * 100)),
              currency: "USD",
            },
          },
        ],
      },
      checkoutOptions: {
        redirectUrl: `${appUrl}/portal/payment-success?type=deposit&id=${quote.id}`,
      },
      prePopulatedData: {
        buyerEmail: quote.customer.email || undefined,
      },
    });

    const paymentLinkUrl = response.paymentLink?.url;
    if (!paymentLinkUrl) {
      console.error("[square/deposit] No payment link URL returned:", response);
      return NextResponse.json(
        { error: "Failed to create payment link" },
        { status: 502 }
      );
    }

    // Create a PaymentEvent for tracking
    const orderId = response.paymentLink?.orderId ?? null;
    await prisma.paymentEvent.create({
      data: {
        quoteId: quote.id,
        squareOrderId: orderId,
        eventType: "deposit.checkout.created",
        amount: depositAmount,
        currency: "USD",
        status: "PENDING",
      },
    });

    return NextResponse.json({ url: paymentLinkUrl });
  } catch (err) {
    console.error("[square/deposit] unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
