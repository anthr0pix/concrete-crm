import { prisma } from "@/lib/prisma";

export async function getNextQuoteNumber(): Promise<string> {
  const last = await prisma.quote.findFirst({ orderBy: { quoteNumber: "desc" } });
  const num = last ? parseInt(last.quoteNumber.replace("Q-", ""), 10) + 1 : 1;
  return `Q-${String(num).padStart(4, "0")}`;
}

export async function getNextInvoiceNumber(): Promise<string> {
  const last = await prisma.invoice.findFirst({ orderBy: { invoiceNumber: "desc" } });
  const num = last ? parseInt(last.invoiceNumber.replace("INV-", ""), 10) + 1 : 1;
  return `INV-${String(num).padStart(4, "0")}`;
}
