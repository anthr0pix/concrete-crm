"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Props {
  depositAmount: number | null;
  depositType: "FIXED" | "PERCENTAGE" | null;
  quoteTotal: number;
  onChange: (amount: number | null, type: "FIXED" | "PERCENTAGE" | null) => void;
}

export default function DepositSettings({ depositAmount, depositType, quoteTotal, onChange }: Props) {
  const [enabled, setEnabled] = useState(depositAmount !== null && depositType !== null);

  const handleToggle = () => {
    if (enabled) {
      setEnabled(false);
      onChange(null, null);
    } else {
      setEnabled(true);
      onChange(0, "FIXED");
    }
  };

  const handleTypeChange = (newType: "FIXED" | "PERCENTAGE") => {
    onChange(depositAmount ?? 0, newType);
  };

  const handleAmountChange = (value: number) => {
    onChange(value, depositType ?? "FIXED");
  };

  const calculatedDeposit =
    depositType === "PERCENTAGE" && depositAmount !== null
      ? quoteTotal * depositAmount / 100
      : depositAmount ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Switch
          id="deposit-toggle"
          checked={enabled}
          onCheckedChange={(checked) => {
            if (checked) { setEnabled(true); onChange(0, "FIXED"); }
            else { setEnabled(false); onChange(null, null); }
          }}
        />
        <Label htmlFor="deposit-toggle" className="cursor-pointer">
          Require deposit before approval
        </Label>
      </div>

      {enabled && (
        <div className="ml-6 space-y-3 border-l-2 border-border pl-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={depositType ?? "FIXED"} onValueChange={(v) => handleTypeChange(v as "FIXED" | "PERCENTAGE")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step={depositType === "PERCENTAGE" ? "1" : "0.01"}
                max={depositType === "PERCENTAGE" ? "100" : undefined}
                value={depositAmount ?? 0}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {depositAmount !== null && depositAmount > 0 && (
            <p className="text-sm text-muted-foreground bg-muted rounded px-3 py-2">
              {depositType === "PERCENTAGE"
                ? `Deposit: $${calculatedDeposit.toFixed(2)} (${depositAmount}% of $${quoteTotal.toFixed(2)})`
                : `Deposit: $${calculatedDeposit.toFixed(2)}`
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
}
