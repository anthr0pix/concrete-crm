"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import NewCustomerDialog from "@/components/customers/NewCustomerDialog";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Customer { id: string; firstName: string; lastName: string }
interface Job { id: string; title: string }

interface Props {
  customers: Customer[];
  jobs?: Job[];
  defaultCustomerId?: string;
  defaultJobId?: string;
}

export default function InvoiceBuilder({ customers, jobs = [], defaultCustomerId, defaultJobId }: Props) {
  const router = useRouter();
  const [customerList, setCustomerList] = useState<Customer[]>(customers);
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [jobId, setJobId] = useState(defaultJobId ?? "");
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [submitting, setSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

  const addLine = () => setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeLine = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof LineItem, value: string | number) =>
    setLineItems(lineItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const subtotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Select a customer"); return; }
    if (lineItems.some((l) => !l.description)) { toast.error("All line items need a description"); return; }

    setSubmitting(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        jobId: jobId || undefined,
        taxRate,
        notes: notes || undefined,
        dueDate: dueDate || undefined,
        lineItems,
      }),
    });
    setSubmitting(false);

    if (!res.ok) { toast.error("Failed to create invoice"); return; }
    const invoice = await res.json();
    toast.success(`Invoice ${invoice.invoiceNumber} created`);
    router.push(`/invoices/${invoice.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="bg-card border rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
      <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Required</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <RequiredLabel>Customer</RequiredLabel>
          <div className="flex gap-2">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select customer...</option>
              {customerList.map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
            </select>
            <NewCustomerDialog onCustomerCreated={(c) => {
              setCustomerList((prev) => [...prev, c].sort((a, b) => a.lastName.localeCompare(b.lastName)));
              setCustomerId(c.id);
            }} />
          </div>
        </div>
        {jobs.length > 0 && (
          <div className="space-y-1">
            <Label>Link to Job (optional)</Label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">No job</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div>
        <RequiredLabel className="mb-2 block">Line Items</RequiredLabel>
        <p className="text-xs text-muted-foreground mb-2">Add at least one line item with a description.</p>

        {/* Desktop layout */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-12 gap-2 mb-1">
            <div className="col-span-6"><span className="text-xs font-medium text-muted-foreground">Description</span></div>
            <div className="col-span-2"><span className="text-xs font-medium text-muted-foreground">Qty</span></div>
            <div className="col-span-3"><span className="text-xs font-medium text-muted-foreground">Unit Price</span></div>
            <div className="col-span-1"><span className="text-xs font-medium text-muted-foreground">Total</span></div>
          </div>
          <div className="space-y-2">
            {lineItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <Input placeholder="e.g. Driveway sealing" value={item.description} onChange={(e) => updateLine(i, "description", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Input type="number" placeholder="0" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateLine(i, "quantity", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-3">
                  <Input type="number" placeholder="0.00" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateLine(i, "unitPrice", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                  {lineItems.length > 1 && (
                    <button type="button" onClick={() => removeLine(i)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-status-danger-bg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="sm:hidden space-y-3">
          {lineItems.map((item, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Description</span>
                  <Input placeholder="e.g. Driveway sealing" value={item.description} onChange={(e) => updateLine(i, "description", e.target.value)} />
                </div>
                {lineItems.length > 1 && (
                  <button type="button" onClick={() => removeLine(i)} className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-status-danger-bg mt-5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Qty</span>
                  <Input type="number" placeholder="0" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateLine(i, "quantity", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Unit Price</span>
                  <Input type="number" placeholder="0.00" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateLine(i, "unitPrice", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="text-right text-sm font-medium text-foreground">
                Total: ${(item.quantity * item.unitPrice).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addLine}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Line
        </Button>
      </div>

      {/* Totals */}
      <div className="bg-muted rounded-lg p-4 space-y-2 sm:max-w-xs sm:ml-auto">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm items-center gap-2">
          <span className="text-muted-foreground">Tax (%)</span>
          <Input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-20 h-7 text-right text-sm" />
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t pt-2">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="sm:max-w-xs">
        <div className="space-y-1">
          <Label>Due Date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <p className="text-xs text-muted-foreground">When payment is due. Defaults to 30 days from today.</p>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, additional info..." />
        <p className="text-xs text-muted-foreground">Shown to the customer on the invoice PDF and portal page.</p>
      </div>

      {/* Sticky submit bar on mobile, normal on desktop */}
      <div className="sticky bottom-0 bg-card py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t md:static md:border-0 md:py-0 md:mx-0 md:px-0">
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="h-11 md:h-9 flex-1 md:flex-none">
            {submitting ? "Creating..." : "Create Invoice"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 md:h-9">Cancel</Button>
        </div>
      </div>
    </form>
  );
}
