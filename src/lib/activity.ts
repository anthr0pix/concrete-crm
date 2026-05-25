import { prisma } from "@/lib/prisma";
import { ActivityType, Prisma } from "@prisma/client";

interface LogActivityParams {
  type: ActivityType;
  customerId: string;
  jobId?: string;
  quoteId?: string;
  invoiceId?: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

/**
 * Fire-and-forget activity logger. Never throws — failures are silently logged.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        type: params.type,
        customerId: params.customerId,
        jobId: params.jobId,
        quoteId: params.quoteId,
        invoiceId: params.invoiceId,
        description: params.description,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.error("[activity] Failed to log activity:", error);
  }
}
