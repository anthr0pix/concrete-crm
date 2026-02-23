"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

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

export default function QuoteBuilder({ customers, jobs = [], defaultCustomerId, defaultJobId }: Props) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [jobId, setJobId] = useState(defaultJobId ?? "");
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

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
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, jobId: jobId || undefined, taxRate, notes, validUntil: validUntil || undefined, lineItems }),
    });
    setSubmitting(false);

    if (!res.ok) { toast.error("Failed to create quote"); return; }
    const quote = await res.json();
    toast.success(`Quote ${quote.quoteNumber} created`);
    router.push(`/quotes/${quote.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Customer</Label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
            <option value="">Select customer...</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </select>
        </div>
        {jobs.length > 0 && (
          <div className="space-y-1">
            <Label>Link to Job (optional)</Label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="">No job</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div>
        <Label className="mb-2 block">Line Items</Label>
        <div className="space-y-2">
          {lineItems.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="Qty"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateLine(i, "quantity", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  placeholder="Unit Price"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateLine(i, "unitPrice", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-1 flex items-center justify-between">
                <span className="text-sm text-slate-500 whitespace-nowrap">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
                {lineItems.length > 1 && (
                  <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addLine}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Line
        </Button>
      </div>

      {/* Totals */}
      <div className="bg-slate-50 rounded-lg p-4 space-y-2 max-w-xs ml-auto">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm items-center gap-2">
          <span className="text-slate-500">Tax (%)</span>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            className="w-20 h-7 text-right text-sm"
          />
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t pt-2">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Valid Until</Label>
          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms, conditions, additional info..." />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Quote"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
