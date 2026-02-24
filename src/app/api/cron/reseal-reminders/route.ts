import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/email";
import { ResealReminderEmail } from "@/components/emails/ResealReminderEmail";
import { format } from "date-fns";
import React from "react";

const FROM_EMAIL = process.env.FROM_EMAIL ?? "Mountain West Surface <reminders@mountainwestsurface.com>";
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL ?? "mwsurfaceco@gmail.com";

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET auth header
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch app settings (or use defaults if none exist)
    const settings = await prisma.appSettings.findFirst();
    const resealReminderEnabled = settings?.resealReminderEnabled ?? true;

    if (!resealReminderEnabled) {
      return NextResponse.json({ success: true, sentCount: 0, message: "Reseal reminders are disabled" });
    }

    // Find completed jobs where resealDueDate is within the next 30 days or already past,
    // and we haven't sent a reminder yet
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const jobs = await prisma.job.findMany({
      where: {
        resealDueDate: {
          not: null,
          lte: thirtyDaysFromNow, // Due within 30 days or already past
        },
        resealReminderSentAt: null,
        status: "COMPLETED",
        customer: {
          email: { not: null },
        },
      },
      include: {
        customer: true,
      },
    });

    let sentCount = 0;
    const resend = getResend();

    for (const job of jobs) {
      const customerEmail = job.customer.email;
      if (!customerEmail) continue;

      const jobAddress = job.address
        ? `${job.address}, ${job.city ?? ""}, ${job.state ?? ""} ${job.zip ?? ""}`.replace(/,\s*,/g, ",").trim()
        : `${job.customer.address}, ${job.customer.city}, ${job.customer.state} ${job.customer.zip}`;

      try {
        const html = await render(
          React.createElement(ResealReminderEmail, {
            customerFirstName: job.customer.firstName,
            jobTitle: job.title,
            resealDueDate: format(new Date(job.resealDueDate!), "MMMM d, yyyy"),
            address: jobAddress,
          })
        );

        const { error: sendError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: customerEmail,
          replyTo: REPLY_TO_EMAIL,
          subject: `Your surface at ${jobAddress} is due for resealing`,
          html,
        });

        if (sendError) {
          console.error(`[cron/reseal-reminders] Failed to send to ${customerEmail}:`, sendError);
          continue;
        }

        // Mark reminder as sent
        await prisma.job.update({
          where: { id: job.id },
          data: { resealReminderSentAt: new Date() },
        });

        sentCount++;
      } catch (err) {
        console.error(`[cron/reseal-reminders] Error processing job ${job.id}:`, err);
        continue;
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (err) {
    console.error("[cron/reseal-reminders] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
