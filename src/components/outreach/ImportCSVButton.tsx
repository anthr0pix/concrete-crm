"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";

interface ParsedRecord {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  propertyCount: number | null;
  estimatedValue: number | null;
  notes: string;
}

interface RowResult {
  record: ParsedRecord;
  errors: string[];
}

const COLUMN_MAP: Record<string, keyof ParsedRecord> = {
  "company name": "companyName",
  company: "companyName",
  "contact name": "contactName",
  contact: "contactName",
  phone: "phone",
  email: "email",
  website: "website",
  "property count": "propertyCount",
  "est. properties": "propertyCount",
  properties: "propertyCount",
  "est. value": "estimatedValue",
  "est. revenue": "estimatedValue",
  "estimated value": "estimatedValue",
  value: "estimatedValue",
  notes: "notes",
};

function mapColumns(headers: string[]): Record<string, keyof ParsedRecord> {
  const mapping: Record<string, keyof ParsedRecord> = {};
  for (const header of headers) {
    const key = header.toLowerCase().trim();
    if (COLUMN_MAP[key]) {
      mapping[header] = COLUMN_MAP[key];
    }
  }
  return mapping;
}

function parseRow(
  row: Record<string, string>,
  columnMapping: Record<string, keyof ParsedRecord>,
): RowResult {
  const record: ParsedRecord = {
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    website: "",
    propertyCount: null,
    estimatedValue: null,
    notes: "",
  };
  const errors: string[] = [];

  for (const [csvHeader, field] of Object.entries(columnMapping)) {
    const value = (row[csvHeader] ?? "").trim();
    if (!value) continue;

    if (field === "propertyCount") {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        record.propertyCount = num;
      } else if (value) {
        errors.push("Invalid property count");
      }
    } else if (field === "estimatedValue") {
      const cleaned = value.replace(/[$,]/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0) {
        record.estimatedValue = num;
      } else if (value) {
        errors.push("Invalid estimated value");
      }
    } else {
      record[field] = value;
    }
  }

  if (!record.companyName) errors.push("Missing company name");

  return { record, errors };
}

const SAMPLE_CSV = `Company Name,Contact Name,Phone,Email,Website,Property Count,Est. Value,Notes
ABC Property Mgmt,John Smith,(801) 555-1234,john@abc.com,https://abc.com,50,15000,Met at conference
Summit HOA Group,Jane Doe,(801) 555-5678,jane@summit.com,,25,8000,Referral from client`;

export default function ImportCSVButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const errorRows = rows.filter((r) => r.errors.length > 0);

  function processRows(data: Record<string, string>[], fields: string[]) {
    const columnMapping = mapColumns(fields);
    if (!columnMapping || Object.keys(columnMapping).length === 0) {
      toast.error(
        "No recognized columns found. Expected: Company Name, Contact Name, Phone, Email, etc.",
      );
      return;
    }
    // Filter out empty rows (all values blank)
    const nonEmpty = data.filter((row) =>
      Object.values(row).some((v) => v && v.trim()),
    );
    const parsed = nonEmpty.map((row) => parseRow(row, columnMapping));
    setRows(parsed);
    setOpen(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const workbook = XLSX.read(evt.target?.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
            defval: "",
            raw: false,
          });
          if (!json.length) {
            toast.error("Spreadsheet appears empty");
            return;
          }
          const fields = Object.keys(json[0]);
          processRows(json, fields);
        } catch {
          toast.error("Failed to parse spreadsheet");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          if (!results.meta.fields?.length) {
            toast.error("Could not parse CSV headers");
            return;
          }
          processRows(results.data, results.meta.fields);
        },
        error(err) {
          toast.error(`Failed to parse CSV: ${err.message}`);
        },
      });
    }

    // Reset so same file can be re-selected
    e.target.value = "";
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);

    try {
      const records = validRows.map((r) => ({
        companyName: r.record.companyName,
        contactName: r.record.contactName,
        phone: r.record.phone || undefined,
        email: r.record.email || undefined,
        website: r.record.website || undefined,
        propertyCount: r.record.propertyCount,
        estimatedValue: r.record.estimatedValue,
        notes: r.record.notes || undefined,
      }));

      const res = await fetch("/api/outreach/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Import failed");
      }

      const data = await res.json();
      toast.success(
        `Imported ${data.imported} prospect${data.imported === 1 ? "" : "s"}`,
      );
      setOpen(false);
      setRows([]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "outreach-import-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-1" /> Import CSV
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!importing) {
            setOpen(v);
            if (!v) setRows([]);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Prospects</DialogTitle>
            <DialogDescription>
              Review parsed data before importing. Only valid rows will be
              imported.
            </DialogDescription>
          </DialogHeader>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              {validRows.length} valid
            </span>
            {errorRows.length > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errorRows.length} with errors
              </span>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Properties</TableHead>
                  <TableHead className="text-right">Est. Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={i}
                    className={
                      row.errors.length > 0
                        ? "bg-red-50 dark:bg-red-950/20"
                        : ""
                    }
                  >
                    <TableCell className="text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.record.companyName || (
                        <span className="text-red-500 italic">Missing</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.record.contactName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.record.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.record.email}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.record.propertyCount ?? ""}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.record.estimatedValue != null &&
                      row.record.estimatedValue > 0
                        ? `$${row.record.estimatedValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr`
                        : ""}
                    </TableCell>
                    <TableCell>
                      {row.errors.length > 0 ? (
                        <span className="text-xs text-red-600">
                          {row.errors.join("; ")}
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">Valid</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2">
            <button
              type="button"
              onClick={downloadSample}
              className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Download sample CSV
            </button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setRows([]);
                }}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
              >
                {importing
                  ? "Importing..."
                  : `Import ${validRows.length} prospect${validRows.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
