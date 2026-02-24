"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props {
  type: "expenses" | "invoices" | "profit-loss";
  year?: number;
  startDate?: string;
  endDate?: string;
  label?: string;
}

export default function ExportButton({ type, year, startDate, endDate, label }: Props) {
  const handleExport = () => {
    const params = new URLSearchParams({ type });
    if (year) params.set("year", String(year));
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    window.open(`/api/reports/export?${params.toString()}`, "_blank");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="w-3.5 h-3.5 mr-1" />
      {label || "Export CSV"}
    </Button>
  );
}
