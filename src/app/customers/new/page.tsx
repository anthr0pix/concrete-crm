import CustomerForm from "@/components/customers/CustomerForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewCustomerPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/customers" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Customers
      </Link>
      <h1 className="text-2xl font-bold mb-6">Add Customer</h1>
      <CustomerForm />
    </div>
  );
}
