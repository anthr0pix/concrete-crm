import { Prisma, ServiceType } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

interface QuoteForJobSpawn {
  id: string;
  quoteNumber: string;
  customerId: string;
  serviceType: ServiceType;
  jobId: string | null;
  notes: string | null;
  customer: {
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
}

export class QuoteAlreadyLinkedError extends Error {
  constructor() {
    super("QUOTE_ALREADY_LINKED");
    this.name = "QuoteAlreadyLinkedError";
  }
}

export async function ensureJobForAcceptedQuote(
  tx: TxClient,
  quote: QuoteForJobSpawn,
): Promise<{ jobId: string; created: boolean }> {
  if (quote.jobId) return { jobId: quote.jobId, created: false };

  const job = await tx.job.create({
    data: {
      customerId: quote.customerId,
      title: `Job for ${quote.quoteNumber}`,
      serviceType: quote.serviceType,
      status: "QUOTED",
      address: quote.customer.address ?? undefined,
      city: quote.customer.city ?? undefined,
      state: quote.customer.state ?? undefined,
      zip: quote.customer.zip ?? undefined,
      notes: quote.notes ?? undefined,
    },
  });

  const linked = await tx.quote.updateMany({
    where: { id: quote.id, jobId: null },
    data: { jobId: job.id },
  });
  if (linked.count === 0) throw new QuoteAlreadyLinkedError();

  return { jobId: job.id, created: true };
}
