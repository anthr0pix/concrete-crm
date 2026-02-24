import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceType } from "@prisma/client";
import { z } from "zod";

const ALLOWED_ORIGINS = new Set([
  process.env.WEBSITE_ORIGIN ?? "https://mountainwestsurface.com",
  "https://www.mountainwestsurface.com",
  "https://mountainwestsurface.com",
]);

// In-memory rate limiter: max 5 requests per IP per 10 minutes.
// Resets on server restart — acceptable for this traffic volume.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Prune expired entries every 30 minutes to prevent unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (entry.resetAt < now) rateLimitMap.delete(ip);
  }
}, 30 * 60 * 1000);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 10 * 60 * 1000; // 10 minutes
  const limit = 5;

  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Map website service values → CRM ServiceType enum
const SERVICE_MAP: Record<string, ServiceType> = {
  "concrete-sealing": ServiceType.CONCRETE_SEALING,
  "pressure-washing": ServiceType.OTHER,
  "soft-washing": ServiceType.OTHER,
  "multiple": ServiceType.OTHER,
  "not-sure": ServiceType.OTHER,
};

const LeadSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(7).max(30),
  email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  service: z.string().optional(),
  sqFootage: z.union([z.string(), z.number()]).optional(),
  location: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
  // Honeypot — must be empty
  "bot-field": z.string().max(0).optional(),
});

function corsHeaders(origin?: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://mountainwestsurface.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

// Handle preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  // Rate limiting — use first non-private IP from x-forwarded-for
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? "unknown");

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  let body: Record<string, unknown>;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid form data", details: parsed.error.flatten() },
      { status: 422, headers: corsHeaders(origin) }
    );
  }

  const data = parsed.data;

  // Honeypot: if bot-field is filled, silently succeed
  if (data["bot-field"]) {
    return NextResponse.json({ success: true }, { headers: corsHeaders(origin) });
  }

  // Parse name into first/last
  const nameParts = data.name.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "(website lead)";

  // Map service type
  const serviceType: ServiceType = SERVICE_MAP[data.service ?? ""] ?? ServiceType.OTHER;

  // Parse sq footage
  const squareFootage = data.sqFootage ? parseFloat(String(data.sqFootage)) : null;

  // Build notes from available info
  const notesParts: string[] = ["Website contact form submission."];
  if (data.location) notesParts.push(`Area: ${data.location}`);
  if (squareFootage) notesParts.push(`Approx sq footage: ${squareFootage}`);
  if (data.message) notesParts.push(data.message);
  const notes = notesParts.join(" | ");

  try {
    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        phone: data.phone,
        email: data.email ?? null,
        address: "—",
        city: data.location ?? "—",
        state: "UT",
        zip: "—",
        referralSource: "Website",
        notes,
        jobs: {
          create: {
            title: `${data.service ? data.service.replace(/-/g, " ") : "Service request"} — website lead`,
            serviceType,
            status: "LEAD",
            squareFootage,
            notes,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true },
      { status: 201, headers: corsHeaders(origin) }
    );
  } catch (err) {
    console.error("[public/leads] DB error:", err);
    return NextResponse.json(
      { error: "Failed to save lead. Please call us at (435) 709-6999." },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
