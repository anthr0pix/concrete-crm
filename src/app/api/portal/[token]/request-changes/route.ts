import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/portal-token";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/email";
import { z } from "zod";

const bodySchema = z.object({
  message: z.string().min(1, "Message is required").max(2000, "Message is too long"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let payload: { type: "quote" | "invoice"; id: string };
  try {
    payload = await verifyPortalToken(token);
  } catch {
    return NextResponse.json({ error: "This link has expired or is invalid." }, { status: 401 });
  }

  if (payload.type !== "quote") {
    return NextResponse.json({ error: "This link cannot be used to request changes." }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: payload.id },
      include: { customer: true },
    });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    if (quote.status !== "SENT" && quote.status !== "DRAFT") {
      return NextResponse.json(
        { error: `This quote has been ${quote.status.toLowerCase()} and changes cannot be requested.` },
        { status: 409 }
      );
    }

    const replyTo = process.env.REPLY_TO_EMAIL || "mwsurfaceco@gmail.com";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.mountainwestsurface.com";

    const resend = getResend();
    const { error: emailError } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "Mountain West Surface <quotes@mountainwestsurface.com>",
      to: replyTo,
      subject: `Change Request: ${quote.quoteNumber} — ${quote.customer.firstName} ${quote.customer.lastName}`,
      html: `
        <h2>Change Request for ${quote.quoteNumber}</h2>
        <p><strong>Customer:</strong> ${quote.customer.firstName} ${quote.customer.lastName}</p>
        ${quote.customer.email ? `<p><strong>Email:</strong> ${quote.customer.email}</p>` : ""}
        ${quote.customer.phone ? `<p><strong>Phone:</strong> ${quote.customer.phone}</p>` : ""}
        <hr />
        <p><strong>Message:</strong></p>
        <blockquote style="border-left: 3px solid #e94560; padding-left: 12px; color: #333;">
          ${parsed.data.message.replace(/\n/g, "<br />")}
        </blockquote>
        <hr />
        <p><a href="${appUrl}/quotes/${quote.id}">View Quote in CRM</a></p>
      `,
      replyTo: quote.customer.email || undefined,
    });

    if (emailError) {
      console.error("[portal/request-changes] Email send error:", emailError);
      return NextResponse.json({ error: "Failed to send request. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[portal/request-changes] Error:", err);
    return NextResponse.json({ error: "Failed to send request. Please try again." }, { status: 500 });
  }
}
