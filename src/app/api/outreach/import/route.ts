import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const recordSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional().default(""),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
  propertyCount: z.number().int().positive().optional().nullable(),
  estimatedValue: z.number().positive().optional().nullable(),
  notes: z.string().optional(),
});

const importSchema = z.object({
  records: z.array(z.unknown()).min(1, "At least one record is required"),
});

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const validRecords: z.infer<typeof recordSchema>[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.data.records.length; i++) {
    const result = recordSchema.safeParse(parsed.data.records[i]);
    if (result.success) {
      validRecords.push(result.data);
    } else {
      const fieldErrors = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      errors.push(`Row ${i + 1}: ${fieldErrors}`);
    }
  }

  if (validRecords.length === 0) {
    return NextResponse.json(
      { imported: 0, skipped: errors.length, errors },
      { status: 400 },
    );
  }

  try {
    const data = validRecords.map((r) => ({
      companyName: r.companyName,
      contactName: r.contactName,
      phone: r.phone || null,
      email: r.email || null,
      website: r.website || null,
      propertyCount: r.propertyCount ?? null,
      estimatedValue: r.estimatedValue ?? null,
      notes: r.notes || null,
    }));

    const result = await prisma.propertyManager.createMany({ data });

    return NextResponse.json({
      imported: result.count,
      skipped: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Failed to import property managers:", error);
    return NextResponse.json(
      { error: "Failed to import property managers" },
      { status: 500 },
    );
  }
}
