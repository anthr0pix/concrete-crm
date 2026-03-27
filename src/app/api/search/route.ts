import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ customers: [], jobs: [], quotes: [], invoices: [] });
  }

  try {
    const [customers, jobs, quotes, invoices, prospects] = await Promise.all([
      prisma.customer.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true },
        take: 5,
        orderBy: { lastName: "asc" },
      }),
      prisma.job.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { customer: { firstName: { contains: q, mode: "insensitive" } } },
            { customer: { lastName: { contains: q, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          title: true,
          customer: { select: { firstName: true, lastName: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.quote.findMany({
        where: {
          OR: [
            { quoteNumber: { contains: q, mode: "insensitive" } },
            { customer: { firstName: { contains: q, mode: "insensitive" } } },
            { customer: { lastName: { contains: q, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          quoteNumber: true,
          customer: { select: { firstName: true, lastName: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { customer: { firstName: { contains: q, mode: "insensitive" } } },
            { customer: { lastName: { contains: q, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          invoiceNumber: true,
          customer: { select: { firstName: true, lastName: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.propertyManager.findMany({
        where: {
          OR: [
            { companyName: { contains: q, mode: "insensitive" } },
            { contactName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        },
        select: { id: true, companyName: true, contactName: true, city: true, state: true },
        take: 5,
        orderBy: { companyName: "asc" },
      }),
    ]);

    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id,
        label: `${c.firstName} ${c.lastName}`,
        sub: c.email || undefined,
        href: `/customers/${c.id}`,
      })),
      jobs: jobs.map((j) => ({
        id: j.id,
        label: j.title,
        sub: `${j.customer.firstName} ${j.customer.lastName}`,
        href: `/jobs/${j.id}`,
      })),
      quotes: quotes.map((q) => ({
        id: q.id,
        label: q.quoteNumber,
        sub: `${q.customer.firstName} ${q.customer.lastName}`,
        href: `/quotes/${q.id}`,
      })),
      invoices: invoices.map((i) => ({
        id: i.id,
        label: i.invoiceNumber,
        sub: `${i.customer.firstName} ${i.customer.lastName}`,
        href: `/invoices/${i.id}`,
      })),
      prospects: prospects.map((p) => ({
        id: p.id,
        label: p.companyName,
        sub: [p.contactName, p.city && p.state ? `${p.city}, ${p.state}` : null].filter(Boolean).join(" · ") || undefined,
        href: `/outreach/${p.id}`,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
