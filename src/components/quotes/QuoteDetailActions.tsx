"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreVertical, Pencil } from "lucide-react";
import QuoteStatusSelect from "./QuoteStatusSelect";
import SendQuoteButton from "./SendQuoteButton";
import DuplicateQuoteButton from "./DuplicateQuoteButton";
import ConvertToInvoiceButton from "./ConvertToInvoiceButton";
import DeleteQuoteButton from "./DeleteQuoteButton";
import { QuoteStatus } from "@prisma/client";

interface Props {
  quoteId: string;
  status: QuoteStatus;
  customerEmail: string | null;
}

export default function QuoteDetailActions({ quoteId, status, customerEmail }: Props) {
  return (
    <>
      {/* Desktop: all buttons visible */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 bg-card border rounded-xl shadow-sm px-3 py-2">
        <QuoteStatusSelect quoteId={quoteId} currentStatus={status} />
        <div className="w-px h-6 bg-border mx-1" />
        {status === "DRAFT" && (
          <Link href={`/quotes/${quoteId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-4 h-4 mr-1.5" /> Edit
            </Button>
          </Link>
        )}
        <SendQuoteButton quoteId={quoteId} customerEmail={customerEmail} />
        <a href={`/api/quotes/${quoteId}/pdf`} download>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </Button>
        </a>
        <div className="w-px h-6 bg-border" />
        <DuplicateQuoteButton quoteId={quoteId} />
        {status === "ACCEPTED" && (
          <ConvertToInvoiceButton quoteId={quoteId} />
        )}
        <DeleteQuoteButton quoteId={quoteId} />
      </div>

      {/* Mobile: primary actions + overflow */}
      <div className="sm:hidden flex flex-wrap items-center gap-2 bg-card border rounded-xl shadow-sm px-3 py-2">
        <QuoteStatusSelect quoteId={quoteId} currentStatus={status} />
        <SendQuoteButton quoteId={quoteId} customerEmail={customerEmail} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {status === "DRAFT" && (
              <DropdownMenuItem asChild>
                <Link href={`/quotes/${quoteId}/edit`} className="w-full">
                  Edit Quote
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <a href={`/api/quotes/${quoteId}/pdf`} download className="w-full">
                Download PDF
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <DuplicateQuoteButton quoteId={quoteId} />
            </DropdownMenuItem>
            {status === "ACCEPTED" && (
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <ConvertToInvoiceButton quoteId={quoteId} />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <DeleteQuoteButton quoteId={quoteId} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
