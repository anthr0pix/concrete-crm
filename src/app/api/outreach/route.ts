import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { OutreachStatus } from "@prisma/client";

const createSchema = z.object({
  companyName: z.string().min(1, "Required"),
  contactName: z.string().min(1, "Required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  propertyCount: z.number().int().positive().optional().nullable(),
  estimatedValue: z.number().positive().optional().nullable(),
  status: z.nativeEnum(OutreachStatus).optional(),
  nextFollowUpAt: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const managers = await prisma.propertyManager.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(managers);
  } catch (error) {
    console.error("Failed to fetch property managers:", error);
    return NextResponse.json(
      { error: "Failed to fetch property managers" },
      { status: 500 },
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { nextFollowUpAt, email, ...rest } = parsed.data;

  try {
    const manager = await prisma.propertyManager.create({
      data: {
        ...rest,
        email: email || null,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
      },
    });
    return NextResponse.json(manager, { status: 201 });
  } catch (error) {
    console.error("Failed to create property manager:", error);
    return NextResponse.json(
      { error: "Failed to create property manager" },
      { status: 500 },
    );
  }
}
