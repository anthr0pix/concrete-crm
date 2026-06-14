import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/email";
import { render } from "@react-email/components";
import { PaymentConfirmationEmail } from "@/components/emails/PaymentConfirmationEmail";
import { DepositConfirmationEmail } from "@/components/emails/DepositConfirmationEmail";
import { format } from "date-fns";
import React from "react";
import { logActivity } from "@/lib/activity";

const FROM_EMAIL =
  process.env.FROM_EMAIL ??
  "Mountain West Surface <payments@mountainwestsurface.com>";
// Invoice payment confirmations are sent from the billing address; falls back to FROM_EMAIL if unset.
const BILLING_FROM_EMAIL = process.env.BILLING_FROM_EMAIL ?? FROM_EMAIL;
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL ?? "mwsurfaceco@gmail.com";

function verifySquareWebhook(body: string, signature: string): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key) return false;
  const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/webhook`;
  const combined = notificationUrl + body;
  const hash = crypto
    .createHmac("sha256", key)
    .update(combined)
    .digest("base64");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-validation") ?? "";

  if (!verifySquareWebhook(rawBody, signature)) {
    console.error("[square/webhook] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    type?: string;
    data?: {
      object?: {
        payment?: {
          id?: string;
          order_id?: string;
          amount_money?: { amount?: number; currency?: string };
          status?: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error("[square/webhook] Failed to parse event body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.type;
  const payment = event.data?.object?.payment;

  if (!payment) {
    // Non-payment event; acknowledge receipt
    return NextResponse.json({ received: true });
  }

  const squarePaymentId = payment.id ?? null;
  const squareOrderId = payment.order_id ?? null;
  const amountCents = payment.amount_money?.amount ?? 0;
  const amountDollars = amountCents / 100;
  const currency = payment.amount_money?.currency ?? "USD";

  try {
    if (eventType === "payment.completed") {
      // Find existing PaymentEvent by squareOrderId to determine what was paid
      const existingEvent = squareOrderId
        ? await prisma.paymentEvent.findFirst({
            where: { squareOrderId },
          })
        : null;

      // Update existing event or create a new one
      if (existingEvent) {
        await prisma.paymentEvent.update({
          where: { id: existingEvent.id },
          data: {
            squarePaymentId,
            eventType: "payment.completed",
            status: "COMPLETED",
            amount: amountDollars,
          },
        });
      } else {
        await prisma.paymentEvent.create({
          data: {
            squarePaymentId,
            squareOrderId,
            eventType: "payment.completed",
            amount: amountDollars,
            currency,
            status: "COMPLETED",
          },
        });
      }

      // Check if this is an invoice payment
      if (existingEvent?.invoiceId) {
        const invoice = await prisma.invoice.findUnique({
          where: { id: existingEvent.invoiceId },
          include: { customer: true },
        });

        if (invoice) {
          const now = new Date();

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "PAID",
              paidDate: now,
              squarePaymentId,
            },
          });

          // Log activity
          logActivity({
            type: "PAYMENT_RECEIVED",
            customerId: invoice.customerId,
            jobId: invoice.jobId ?? undefined,
            invoiceId: invoice.id,
            description: `Payment of $${amountDollars.toFixed(2)} received`,
            metadata: { amount: amountDollars, invoiceNumber: invoice.invoiceNumber, squarePaymentId },
          });

          // Send payment confirmation email
          if (invoice.customer.email) {
            await sendPaymentConfirmationEmail(
              invoice.customer.email,
              invoice.customer.firstName,
              invoice.invoiceNumber,
              amountDollars,
              now
            );
          }
        }
      }

      // Check if this is a deposit payment
      if (existingEvent?.quoteId) {
        const quote = await prisma.quote.findUnique({
          where: { id: existingEvent.quoteId },
          include: { customer: true },
        });

        if (quote) {
          const now = new Date();

          await prisma.quote.update({
            where: { id: quote.id },
            data: {
              depositPaid: true,
              depositPaidAt: now,
              squareDepositPaymentId: squarePaymentId,
            },
          });

          // Log activity
          logActivity({
            type: "DEPOSIT_RECEIVED",
            customerId: quote.customerId,
            jobId: quote.jobId ?? undefined,
            quoteId: quote.id,
            description: `Deposit of $${amountDollars.toFixed(2)} received`,
            metadata: { amount: amountDollars, quoteNumber: quote.quoteNumber, squarePaymentId },
          });

          // Send deposit confirmation email
          if (quote.customer.email) {
            await sendDepositConfirmationEmail(
              quote.customer.email,
              quote.customer.firstName,
              quote.quoteNumber,
              amountDollars,
              now
            );
          }
        }
      }
    } else if (eventType === "payment.failed") {
      // Find and update existing PaymentEvent
      const existingEvent = squareOrderId
        ? await prisma.paymentEvent.findFirst({
            where: { squareOrderId },
          })
        : null;

      if (existingEvent) {
        await prisma.paymentEvent.update({
          where: { id: existingEvent.id },
          data: {
            squarePaymentId,
            eventType: "payment.failed",
            status: "FAILED",
          },
        });
      } else {
        await prisma.paymentEvent.create({
          data: {
            squarePaymentId,
            squareOrderId,
            eventType: "payment.failed",
            amount: amountDollars,
            currency,
            status: "FAILED",
          },
        });
      }
    }
  } catch (err) {
    // Log but still return 200 so Square doesn't retry
    console.error("[square/webhook] Error processing event:", err);
  }

  // Always return 200 to acknowledge receipt (Square retries on non-200)
  return NextResponse.json({ received: true });
}

async function sendPaymentConfirmationEmail(
  email: string,
  firstName: string,
  invoiceNumber: string,
  amount: number,
  paidDate: Date
) {
  try {
    const html = await render(
      React.createElement(PaymentConfirmationEmail, {
        customerFirstName: firstName,
        invoiceNumber,
        amountPaid: amount,
        paidDate: format(paidDate, "MMMM d, yyyy"),
      })
    );

    const resend = getResend();
    const { error } = await resend.emails.send({
      from: BILLING_FROM_EMAIL,
      to: email,
      replyTo: REPLY_TO_EMAIL,
      subject: `Payment Received - Invoice ${invoiceNumber}`,
      html,
    });

    if (error) {
      console.error("[square/webhook] Failed to send payment confirmation:", error);
    }
  } catch (err) {
    console.error("[square/webhook] Error sending payment confirmation:", err);
  }
}

async function sendDepositConfirmationEmail(
  email: string,
  firstName: string,
  quoteNumber: string,
  amount: number,
  paidDate: Date
) {
  try {
    const html = await render(
      React.createElement(DepositConfirmationEmail, {
        customerFirstName: firstName,
        quoteNumber,
        depositAmount: amount,
        paidDate: format(paidDate, "MMMM d, yyyy"),
      })
    );

    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: REPLY_TO_EMAIL,
      subject: `Deposit Received - Quote ${quoteNumber}`,
      html,
    });

    if (error) {
      console.error("[square/webhook] Failed to send deposit confirmation:", error);
    }
  } catch (err) {
    console.error("[square/webhook] Error sending deposit confirmation:", err);
  }
}
