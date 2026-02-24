import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";

const expenseSchema = z.object({
  date: z.string().min(1),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1),
  amount: z.number().positive(),
  vendor: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  jobId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const jobId = searchParams.get("jobId");

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        ...(category ? { category: category as ExpenseCategory } : {}),
        ...(jobId ? { jobId } : {}),
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: "desc" },
      include: {
        job: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { date, ...rest } = parsed.data;

  try {
    const expense = await prisma.expense.create({
      data: {
        ...rest,
        date: new Date(date),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
