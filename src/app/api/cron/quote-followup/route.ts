import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/email";
import { signPortalToken } from "@/lib/portal-token";
import { render } from "@react-email/components";
import { QuoteFollowUpEmail } from "@/components/emails/QuoteFollowUpEmail";
import React from "react";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse follow-up day thresholds from env (default: "3,7")
    const followUpDays = (process.env.QUOTE_FOLLOWUP_DAYS || "3,7")
      .split(",")
      .map((d) => parseInt(d.trim()))
      .filter((d) => !isNaN(d))
      .sort((a, b) => a - b);

    // Find SENT quotes where createdAt matches follow-up day thresholds
    // and followUpCount < number of thresholds
    const now = new Date();
    let sentCount = 0;

    for (const dayThreshold of followUpDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - dayThreshold);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Find quotes that were sent on this target date and haven't had this follow-up yet
      const quotes = await prisma.quote.findMany({
        where: {
          status: "SENT",
          createdAt: { gte: dayStart, lte: dayEnd },
          followUpCount: { lt: followUpDays.indexOf(dayThreshold) + 1 },
        },
        include: { customer: true, lineItems: true },
      });

      for (const quote of quotes) {
        if (!quote.customer.email) continue;

        const token = await signPortalToken({ type: "quote", id: quote.id });
        const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${token}`;

        const resend = getResend();
        const html = await render(
          React.createElement(QuoteFollowUpEmail, {
            customerFirstName: quote.customer.firstName,
            quoteNumber: quote.quoteNumber,
            quoteTotal: quote.total,
            portalUrl,
            daysSince: dayThreshold,
          })
        );

        const fromEmail = process.env.FROM_EMAIL || "Mountain West Surface <quotes@mountainwestsurface.com>";
        const replyTo = process.env.REPLY_TO_EMAIL || "mwsurfaceco@gmail.com";

        const { error } = await resend.emails.send({
          from: fromEmail,
          to: quote.customer.email,
          replyTo,
          subject: `Following up on your quote ${quote.quoteNumber}`,
          html,
        });

        if (!error) {
          await prisma.quote.update({
            where: { id: quote.id },
            data: {
              followUpCount: { increment: 1 },
              lastFollowUpAt: new Date(),
            },
          });

          logActivity({
            type: "FOLLOW_UP_SENT",
            customerId: quote.customerId,
            jobId: quote.jobId ?? undefined,
            quoteId: quote.id,
            description: `Follow-up #${quote.followUpCount + 1} sent for quote ${quote.quoteNumber}`,
            metadata: { recipient: quote.customer.email, followUpNumber: quote.followUpCount + 1 },
          });

          sentCount++;
        } else {
          console.error(`[quote-followup] Failed to send to ${quote.customer.email}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (err) {
    console.error("[quote-followup] Error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
