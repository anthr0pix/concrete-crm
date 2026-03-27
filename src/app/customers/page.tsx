import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Phone, Mail, MapPin, Search, Users, Briefcase, ArrowRight } from "lucide-react";
import { formatPhone, cn } from "@/lib/utils";
import { JOB_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { JobStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES: JobStatus[] = ["LEAD", "QUOTED", "SCHEDULED", "IN_PROGRESS"];

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-indigo-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "past", label: "Past" },
];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; filter?: string }>;
}) {
  const { search, filter } = await searchParams;
  const activeFilter = filter || "all";

  const searchWhere = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  // Filter by active/past based on job statuses
  const filterWhere =
    activeFilter === "active"
      ? { jobs: { some: { status: { in: ACTIVE_STATUSES } } } }
      : activeFilter === "past"
        ? {
            AND: [
              { jobs: { none: { status: { in: ACTIVE_STATUSES } } } },
            ],
          }
        : undefined;

  const where =
    searchWhere && filterWhere
      ? { AND: [searchWhere, filterWhere] }
      : searchWhere || filterWhere || undefined;

  const [customers, totalCount, activeCount, pastCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { lastName: "asc" },
      include: {
        _count: { select: { jobs: true, quotes: true, invoices: true } },
        jobs: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { status: true, title: true },
        },
      },
    }),
    prisma.customer.count(),
    prisma.customer.count({
      where: { jobs: { some: { status: { in: ACTIVE_STATUSES } } } },
    }),
    prisma.customer.count({
      where: { jobs: { none: { status: { in: ACTIVE_STATUSES } } } },
    }),
  ]);

  // Group by first letter of last name
  const grouped: Record<string, typeof customers> = {};
  for (const c of customers) {
    const letter = (c.lastName[0] || "#").toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  }
  const letters = Object.keys(grouped).sort();

  const filterCounts: Record<string, number> = {
    all: totalCount,
    active: activeCount,
    past: pastCount,
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {customers.length} {activeFilter !== "all" ? activeFilter : ""} customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Filter tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex bg-muted rounded-lg p-1 shrink-0">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            const href =
              f.key === "all"
                ? `/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`
                : `/customers?filter=${f.key}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
            return (
              <Link
                key={f.key}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
                <span className="ml-1.5 text-xs text-muted-foreground">{filterCounts[f.key]}</span>
              </Link>
            );
          })}
        </div>
        <form className="flex-1">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by name, phone, or email..."
              className="pl-9"
            />
          </div>
        </form>
      </div>

      {/* Letter jump bar */}
      {letters.length > 1 && !search && (
        <div className="flex flex-wrap gap-1 mb-4">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-7 h-7 flex items-center justify-center rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {letter}
            </a>
          ))}
        </div>
      )}

      {/* Customer list */}
      {customers.length === 0 ? (
        <div className="text-center py-20 rounded-xl border-2 border-dashed border-border">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground mb-1">No customers found</p>
          <p className="text-sm text-muted-foreground mb-5">
            {search
              ? "Try adjusting your search."
              : activeFilter !== "all"
                ? `No ${activeFilter} customers.`
                : "Add your first customer to get started."}
          </p>
          {!search && activeFilter === "all" && (
            <Link href="/customers/new">
              <Button>+ Add Customer</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {letters.map((letter) => (
            <div key={letter} id={`letter-${letter}`}>
              {/* Letter header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                  {letter}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {grouped[letter].length}
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[letter].map((c) => {
                  const initials = `${c.firstName[0] || ""}${c.lastName[0] || ""}`.toUpperCase();
                  const avatarColor = getAvatarColor(`${c.firstName}${c.lastName}`);
                  const latestJob = c.jobs[0];
                  const hasActiveJob = latestJob && ACTIVE_STATUSES.includes(latestJob.status);

                  return (
                    <Link key={c.id} href={`/customers/${c.id}`}>
                      <div className="bg-card border rounded-xl shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all duration-150 cursor-pointer group h-full flex flex-col">
                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative shrink-0">
                            <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-bold`}>
                              {initials}
                            </div>
                            {hasActiveJob && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card" title="Active job" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">
                              {c.firstName} {c.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              <MapPin className="w-3 h-3 inline mr-0.5" />
                              {c.city}, {c.state}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                        </div>

                        {/* Contact */}
                        <div className="space-y-1 mb-3 text-sm">
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{formatPhone(c.phone)}</span>
                          </p>
                          {c.email && (
                            <p className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{c.email}</span>
                            </p>
                          )}
                        </div>

                        {/* Stats + latest job */}
                        <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Briefcase className="w-3 h-3" />
                            <span>{c._count.jobs} job{c._count.jobs !== 1 ? "s" : ""}</span>
                          </div>
                          {latestJob && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-auto ${STATUS_COLORS[latestJob.status] || ""}`}>
                              {JOB_STATUS_LABELS[latestJob.status] || latestJob.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
