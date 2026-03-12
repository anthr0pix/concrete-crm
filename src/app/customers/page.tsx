import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, MapPin, Search, Users } from "lucide-react";
import SortSelect from "@/components/ui/sort-select";
import Pagination from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "last_name_asc", label: "Last Name A\u2013Z" },
  { value: "last_name_desc", label: "Last Name Z\u2013A" },
  { value: "most_jobs", label: "Most Jobs" },
  { value: "newest", label: "Newest" },
];

const SORT_MAP: Record<string, object> = {
  last_name_asc: { lastName: "asc" },
  last_name_desc: { lastName: "desc" },
  most_jobs: { jobs: { _count: "desc" } },
  newest: { createdAt: "desc" },
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string; page?: string }>;
}) {
  const { search, sort, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const orderBy = SORT_MAP[sort || "last_name_asc"] || SORT_MAP.last_name_asc;

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      include: { _count: { select: { jobs: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">{totalCount} total</p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 mb-6">
        <form className="flex-1">
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name, phone, or email..."
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>
        <Suspense fallback={<div className="border rounded-md px-2 py-1.5 text-sm w-28 bg-card" />}>
          <SortSelect options={SORT_OPTIONS} basePath="/customers" />
        </Suspense>
      </div>

      {/* List */}
      {customers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-lg font-medium">No customers found</p>
          <p className="text-sm mt-1">
            {search ? "Try adjusting your search." : "Add your first customer to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <div className="flex items-center justify-between bg-card rounded-xl shadow-sm px-5 py-4 hover:shadow-md hover:-translate-y-px transition-all duration-150 cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">
                      {c.lastName}, {c.firstName}
                    </span>
                    <Badge variant="secondary">{c._count.jobs} jobs</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {c.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {c.city}, {c.state}
                    </span>
                  </div>
                </div>
                {c.email && (
                  <span className="text-sm text-muted-foreground ml-4 hidden sm:block">{c.email}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        baseUrl="/customers"
        searchParams={{ search, sort }}
      />
    </div>
  );
}
