import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/email";
import { render } from "@react-email/components";
import { ReviewRequestEmail } from "@/components/emails/ReviewRequestEmail";
import React from "react";

const FROM_EMAIL = process.env.FROM_EMAIL ?? "Mountain West Surface <reviews@mountainwestsurface.com>";
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL ?? "mwsurfaceco@gmail.com";

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch AppSettings singleton (or use defaults)
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    const reviewRequestEnabled = settings?.reviewRequestEnabled ?? true;
    const reviewDelayDays = settings?.reviewDelayDays ?? 1;
    const googleReviewUrl = settings?.googleReviewUrl ?? process.env.GOOGLE_REVIEW_URL;

    // If review requests are disabled, return early
    if (!reviewRequestEnabled) {
      return NextResponse.json({ skipped: true });
    }

    // If no review URL is configured anywhere, skip
    if (!googleReviewUrl) {
      return NextResponse.json({ skipped: true, reason: "No Google review URL configured" });
    }

    // Calculate the target date: exactly reviewDelayDays ago
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - reviewDelayDays);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Find COMPLETED jobs where completedDate is exactly reviewDelayDays ago
    // and reviewRequestSentAt is null (haven't sent yet)
    // and customer has an email
    const jobs = await prisma.job.findMany({
      where: {
        status: "COMPLETED",
        completedDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        reviewRequestSentAt: null,
        customer: {
          email: { not: null },
        },
      },
      include: { customer: true },
    });

    let sentCount = 0;
    const resend = getResend();

    for (const job of jobs) {
      // Double-check customer email (TypeScript narrowing)
      if (!job.customer.email) continue;

      const html = await render(
        React.createElement(ReviewRequestEmail, {
          customerFirstName: job.customer.firstName,
          jobTitle: job.title,
          reviewUrl: googleReviewUrl,
        })
      );

      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: job.customer.email,
        replyTo: REPLY_TO_EMAIL,
        subject: "How was your experience with Mountain West Surface?",
        html,
      });

      if (!error) {
        await prisma.job.update({
          where: { id: job.id },
          data: { reviewRequestSentAt: new Date() },
        });
        sentCount++;
      } else {
        console.error(`[review-requests] Failed to send to ${job.customer.email}:`, error);
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (err) {
    console.error("[review-requests] Error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
