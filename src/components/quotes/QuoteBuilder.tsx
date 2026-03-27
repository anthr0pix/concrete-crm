"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DepositSettings from "@/components/quotes/DepositSettings";
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
  quoteId?: string;
  defaultLineItems?: LineItem[];
  defaultTaxRate?: number;
  defaultNotes?: string;
  defaultValidUntil?: string;
  defaultDepositAmount?: number | null;
  defaultDepositType?: "FIXED" | "PERCENTAGE" | null;
}

export default function QuoteBuilder({ customers, jobs = [], defaultCustomerId, defaultJobId, quoteId, defaultLineItems, defaultTaxRate, defaultNotes, defaultValidUntil, defaultDepositAmount, defaultDepositType }: Props) {
  const isEdit = !!quoteId;
  const router = useRouter();
  const [customerList, setCustomerList] = useState<Customer[]>(customers);
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [jobId, setJobId] = useState(defaultJobId ?? "");
  const [taxRate, setTaxRate] = useState(defaultTaxRate ?? 0);
  const [notes, setNotes] = useState(defaultNotes ?? "");
  const [validUntil, setValidUntil] = useState(() => {
    if (defaultValidUntil) return defaultValidUntil;
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [depositAmount, setDepositAmount] = useState<number | null>(defaultDepositAmount ?? null);
  const [depositType, setDepositType] = useState<"FIXED" | "PERCENTAGE" | null>(defaultDepositType ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>(
    defaultLineItems ?? [{ description: "", quantity: 1, unitPrice: 0 }]
  );

  useUnsavedChanges(touched);
  const markTouched = useCallback(() => setTouched(true), []);

  const addLine = () => { setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]); markTouched(); };
  const removeLine = (i: number) => { setLineItems(lineItems.filter((_, idx) => idx !== i)); markTouched(); };
  const updateLine = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
    markTouched();
  };

  const subtotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !customerId) { toast.error("Select a customer"); return; }
    if (lineItems.some((l) => !l.description)) { toast.error("All line items need a description"); return; }

    setSubmitting(true);
    const url = isEdit ? `/api/quotes/${quoteId}` : "/api/quotes";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(isEdit ? {} : { customerId }),
        jobId: jobId || null,
        taxRate,
        notes,
        validUntil: validUntil || undefined,
        lineItems,
        depositAmount,
        depositType,
      }),
    });
    setSubmitting(false);

    if (!res.ok) { toast.error(isEdit ? "Failed to update quote" : "Failed to create quote"); return; }
    setTouched(false);
    const quote = await res.json();
    toast.success(isEdit ? "Quote updated" : `Quote ${quote.quoteNumber} created`);
    router.push(`/quotes/${isEdit ? quoteId : quote.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} onChangeCapture={markTouched} className="bg-card border rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
      <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Required</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!isEdit && (
          <div className="space-y-1">
            <RequiredLabel>Customer</RequiredLabel>
            <div className="flex gap-2">
              <Select value={customerId || undefined} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customerList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.lastName}, {c.firstName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <NewCustomerDialog onCustomerCreated={(c) => {
                setCustomerList((prev) => [...prev, c].sort((a, b) => a.lastName.localeCompare(b.lastName)));
                setCustomerId(c.id);
              }} />
            </div>
          </div>
        )}
        {jobs.length > 0 && (
          <div className="space-y-1">
            <Label>Link to Job (optional)</Label>
            <Select value={jobId || "none"} onValueChange={(v) => setJobId(v === "none" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No job</SelectItem>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <div className="col-span-2"><span className="text-xs font-medium text-muted-foreground">Sq Ft</span></div>
            <div className="col-span-3"><span className="text-xs font-medium text-muted-foreground">Price per Sq Ft</span></div>
            <div className="col-span-1"><span className="text-xs font-medium text-muted-foreground">Total</span></div>
          </div>
          <div className="space-y-2">
            {lineItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <Input
                    placeholder="e.g. Driveway sealing"
                    value={item.description}
                    onChange={(e) => updateLine(i, "description", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="0"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateLine(i, "quantity", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLine(i, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
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
                  <Input
                    placeholder="e.g. Driveway sealing"
                    value={item.description}
                    onChange={(e) => updateLine(i, "description", e.target.value)}
                  />
                </div>
                {lineItems.length > 1 && (
                  <button type="button" onClick={() => removeLine(i)} className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-status-danger-bg mt-5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Sq Ft</span>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateLine(i, "quantity", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Price / Sq Ft</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLine(i, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
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
          <Label>Valid Until</Label>
          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          <p className="text-xs text-muted-foreground">How long the customer has to accept this quote.</p>
        </div>
      </div>

      <DepositSettings
        depositAmount={depositAmount}
        depositType={depositType}
        quoteTotal={total}
        onChange={(amount, type) => {
          setDepositAmount(amount);
          setDepositType(type);
        }}
      />

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms, conditions, additional info..." />
        <p className="text-xs text-muted-foreground">Shown to the customer on the quote PDF and portal page.</p>
      </div>

      {/* Sticky submit bar on mobile, normal on desktop */}
      <div className="sticky bottom-0 bg-card py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t md:static md:border-0 md:py-0 md:mx-0 md:px-0">
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="h-11 md:h-9 flex-1 md:flex-none">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {isEdit ? "Saving..." : "Creating..."}</> : (isEdit ? "Save Changes" : "Create Quote")}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 md:h-9">Cancel</Button>
        </div>
      </div>
    </form>
  );
}
