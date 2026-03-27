import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { OutreachStatus } from "@prisma/client";

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  propertyCount: z.number().int().positive().optional().nullable(),
  estimatedValue: z.number().positive().optional().nullable(),
  status: z.nativeEnum(OutreachStatus).optional(),
  lastContactedAt: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const manager = await prisma.propertyManager.findUnique({
      where: { id },
    });
    if (!manager) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(manager);
  } catch (error) {
    console.error("Failed to fetch property manager:", error);
    return NextResponse.json(
      { error: "Failed to fetch property manager" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { nextFollowUpAt, lastContactedAt, email, ...rest } = parsed.data;

  try {
    const manager = await prisma.propertyManager.update({
      where: { id },
      data: {
        ...rest,
        ...(email !== undefined ? { email: email || null } : {}),
        ...(nextFollowUpAt !== undefined
          ? { nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null }
          : {}),
        ...(lastContactedAt !== undefined
          ? {
              lastContactedAt: lastContactedAt
                ? new Date(lastContactedAt)
                : null,
            }
          : {}),
      },
    });
    return NextResponse.json(manager);
  } catch (error) {
    console.error("Failed to update property manager:", error);
    return NextResponse.json(
      { error: "Failed to update property manager" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.propertyManager.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete property manager:", error);
    return NextResponse.json(
      { error: "Failed to delete property manager" },
      { status: 500 },
    );
  }
}
