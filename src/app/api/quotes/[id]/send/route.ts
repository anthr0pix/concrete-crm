import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { render } from "@react-email/components";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/email";
import { signPortalToken } from "@/lib/portal-token";
import { QuotePDF } from "@/components/pdf/QuotePDF";
import { QuoteEmail } from "@/components/emails/QuoteEmail";
import { format } from "date-fns";
import React from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.mountainwestsurface.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "Mountain West Surface <quotes@mountainwestsurface.com>";
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL ?? "mwsurfaceco@gmail.com";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, job: true, lineItems: true },
  });

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!quote.customer.email) {
    return NextResponse.json(
      { error: "Customer does not have an email address on file." },
      { status: 422 }
    );
  }

  try {
    // Generate portal token
    const token = await signPortalToken({ type: "quote", id: quote.id });
    const portalUrl = `${APP_URL}/portal/${token}`;

    // Generate PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(React.createElement(QuotePDF, { quote }) as any);

    // Build email HTML
    const html = await render(
      React.createElement(QuoteEmail, {
        customerFirstName: quote.customer.firstName,
        quoteNumber: quote.quoteNumber,
        quoteTotal: quote.total,
        validUntil: quote.validUntil
          ? format(new Date(quote.validUntil), "MMMM d, yyyy")
          : null,
        portalUrl,
        lineItems: quote.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          total: li.total,
        })),
        notes: quote.notes,
      })
    );

    // Send via Resend
    const resend = getResend();
    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: quote.customer.email,
      replyTo: REPLY_TO_EMAIL,
      subject: `Quote ${quote.quoteNumber} from Mountain West Surface`,
      html,
      attachments: [
        {
          filename: `${quote.quoteNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (sendError) {
      console.error("[send/quote] Resend error:", sendError);
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 502 });
    }

    // Update quote status to SENT
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "SENT" },
    });

    // Auto-transition: sending a quote for a LEAD job → QUOTED
    if (quote.jobId) {
      await prisma.job.updateMany({
        where: { id: quote.jobId, status: "LEAD" },
        data: { status: "QUOTED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send/quote] unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
