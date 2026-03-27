import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import OutreachBoard from "@/components/outreach/OutreachBoard";
import ImportCSVButton from "@/components/outreach/ImportCSVButton";

export const dynamic = "force-dynamic";

const STATUSES = [
  "PROSPECT",
  "CONTACTED",
  "IN_CONVERSATION",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
] as const;

export default async function OutreachPage() {
  const managers = await prisma.propertyManager.findMany({
    orderBy: { updatedAt: "desc" },
  });

  // Group by status
  const grouped: Record<string, typeof managers> = {};
  for (const s of STATUSES) grouped[s] = [];
  for (const m of managers) {
    if (grouped[m.status]) grouped[m.status].push(m);
  }

  // Serialize for client component
  const serialized = Object.fromEntries(
    Object.entries(grouped).map(([status, items]) => [
      status,
      items.map((m) => ({
        id: m.id,
        companyName: m.companyName,
        contactName: m.contactName,
        propertyCount: m.propertyCount,
        estimatedValue: m.estimatedValue,
        nextFollowUpAt: m.nextFollowUpAt?.toISOString() ?? null,
      })),
    ]),
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track property management companies through your sales process.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportCSVButton />
          <Link href="/outreach/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Prospect
            </Button>
          </Link>
        </div>
      </div>
      <OutreachBoard initialItems={serialized} />
    </div>
  );
}
