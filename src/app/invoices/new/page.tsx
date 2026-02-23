import { redirect } from "next/navigation";

// Invoice creation is primarily done by converting an accepted quote.
// For direct invoice creation, redirect to quotes.
export default function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  // Quick redirect — in a future iteration this can be a full invoice builder
  void searchParams;
  redirect("/quotes/new");
}
