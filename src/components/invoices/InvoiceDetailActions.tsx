"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreVertical } from "lucide-react";
import InvoiceStatusSelect from "./InvoiceStatusSelect";
import SendInvoiceButton from "./SendInvoiceButton";
import DuplicateInvoiceButton from "./DuplicateInvoiceButton";
import MarkPaidButton from "./MarkPaidButton";
import PayNowButton from "./PayNowButton";
import DeleteInvoiceButton from "./DeleteInvoiceButton";
import { InvoiceStatus } from "@prisma/client";

interface Props {
  invoiceId: string;
  status: InvoiceStatus;
  customerEmail: string | null;
}

export default function InvoiceDetailActions({ invoiceId, status, customerEmail }: Props) {
  return (
    <>
      {/* Desktop: all buttons visible */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 bg-card border rounded-xl shadow-sm px-3 py-2">
        <InvoiceStatusSelect invoiceId={invoiceId} currentStatus={status} />
        <div className="w-px h-6 bg-border mx-1" />
        <SendInvoiceButton invoiceId={invoiceId} customerEmail={customerEmail} />
        <a href={`/api/invoices/${invoiceId}/pdf`} download>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </Button>
        </a>
        <div className="w-px h-6 bg-border" />
        <DuplicateInvoiceButton invoiceId={invoiceId} />
        {status !== "PAID" && status !== "VOID" && (
          <>
            <MarkPaidButton invoiceId={invoiceId} />
            <PayNowButton invoiceId={invoiceId} />
          </>
        )}
        <DeleteInvoiceButton invoiceId={invoiceId} />
      </div>

      {/* Mobile: primary actions + overflow */}
      <div className="sm:hidden flex flex-wrap items-center gap-2 bg-card border rounded-xl shadow-sm px-3 py-2">
        <InvoiceStatusSelect invoiceId={invoiceId} currentStatus={status} />
        <SendInvoiceButton invoiceId={invoiceId} customerEmail={customerEmail} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={`/api/invoices/${invoiceId}/pdf`} download className="w-full">
                Download PDF
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <DuplicateInvoiceButton invoiceId={invoiceId} />
            </DropdownMenuItem>
            {status !== "PAID" && status !== "VOID" && (
              <>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <MarkPaidButton invoiceId={invoiceId} />
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <PayNowButton invoiceId={invoiceId} />
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <DeleteInvoiceButton invoiceId={invoiceId} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
