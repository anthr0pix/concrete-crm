import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { render } from "@react-email/components";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/email";
import { signPortalToken } from "@/lib/portal-token";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import { InvoiceEmail } from "@/components/emails/InvoiceEmail";
import { format } from "date-fns";
import React from "react";
import { logActivity } from "@/lib/activity";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.mountainwestsurface.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "Mountain West Surface <invoices@mountainwestsurface.com>";
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL ?? "mwsurfaceco@gmail.com";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, job: true, quote: true, lineItems: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!invoice.customer.email) {
    return NextResponse.json(
      { error: "Customer does not have an email address on file." },
      { status: 422 }
    );
  }

  try {
    // Generate portal token
    const token = await signPortalToken({ type: "invoice", id: invoice.id });
    const portalUrl = `${APP_URL}/portal/${token}`;

    // Generate PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(React.createElement(InvoicePDF, { invoice }) as any);

    // Build email HTML
    const html = await render(
      React.createElement(InvoiceEmail, {
        customerFirstName: invoice.customer.firstName,
        invoiceNumber: invoice.invoiceNumber,
        invoiceTotal: invoice.total,
        dueDate: invoice.dueDate
          ? format(new Date(invoice.dueDate), "MMMM d, yyyy")
          : null,
        portalUrl,
        lineItems: invoice.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          total: li.total,
        })),
        notes: invoice.notes,
      })
    );

    // Send via Resend
    const resend = getResend();
    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: invoice.customer.email,
      replyTo: REPLY_TO_EMAIL,
      subject: `Invoice ${invoice.invoiceNumber} from Mountain West Surface`,
      html,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (sendError) {
      console.error("[send/invoice] Resend error:", sendError);
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 502 });
    }

    // Log activity
    logActivity({
      type: "EMAIL_SENT",
      customerId: invoice.customerId,
      jobId: invoice.jobId ?? undefined,
      invoiceId: invoice.id,
      description: `Invoice ${invoice.invoiceNumber} sent to ${invoice.customer.email}`,
      metadata: { recipient: invoice.customer.email, invoiceNumber: invoice.invoiceNumber },
    });

    // Update status to SENT if still in DRAFT
    if (invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send/invoice] unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
