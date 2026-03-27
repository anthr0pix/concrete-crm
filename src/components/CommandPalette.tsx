"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Briefcase,
  FileText,
  Receipt,
  Megaphone,
  Plus,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  href: string;
}

interface SearchResults {
  customers: SearchResult[];
  jobs: SearchResult[];
  quotes: SearchResult[];
  invoices: SearchResult[];
  prospects: SearchResult[];
}

const EMPTY: SearchResults = { customers: [], jobs: [], quotes: [], invoices: [], prospects: [] };

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(EMPTY);
      setLoading(false);
    }
  }, [open]);

  const search = useCallback((q: string) => {
    abortRef.current?.abort();
    clearTimeout(debounceRef.current);

    if (q.trim().length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Search error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  const hasResults =
    results.customers.length > 0 ||
    results.jobs.length > 0 ||
    results.quotes.length > 0 ||
    results.invoices.length > 0 ||
    results.prospects.length > 0;

  const showSearch = query.trim().length >= 2;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search customers, jobs, quotes, invoices, and prospects"
    >
      <CommandInput
        placeholder="Search customers, jobs, quotes, invoices, prospects..."
        value={query}
        onValueChange={(val) => {
          setQuery(val);
          search(val);
        }}
      />
      <CommandList>
        {showSearch && !loading && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        )}

        {results.customers.length > 0 && (
          <CommandGroup heading="Customers">
            {results.customers.map((item) => (
              <CommandItem
                key={item.id}
                value={`customer-${item.label}`}
                onSelect={() => handleSelect(item.href)}
              >
                <Users className="text-blue-500" />
                <span>{item.label}</span>
                {item.sub && (
                  <span className="ml-auto text-xs text-muted-foreground truncate">
                    {item.sub}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.jobs.length > 0 && (
          <CommandGroup heading="Jobs">
            {results.jobs.map((item) => (
              <CommandItem
                key={item.id}
                value={`job-${item.label}`}
                onSelect={() => handleSelect(item.href)}
              >
                <Briefcase className="text-green-500" />
                <span className="truncate">{item.label}</span>
                {item.sub && (
                  <span className="ml-auto text-xs text-muted-foreground truncate">
                    {item.sub}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.quotes.length > 0 && (
          <CommandGroup heading="Quotes">
            {results.quotes.map((item) => (
              <CommandItem
                key={item.id}
                value={`quote-${item.label}`}
                onSelect={() => handleSelect(item.href)}
              >
                <FileText className="text-purple-500" />
                <span>{item.label}</span>
                {item.sub && (
                  <span className="ml-auto text-xs text-muted-foreground truncate">
                    {item.sub}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.invoices.length > 0 && (
          <CommandGroup heading="Invoices">
            {results.invoices.map((item) => (
              <CommandItem
                key={item.id}
                value={`invoice-${item.label}`}
                onSelect={() => handleSelect(item.href)}
              >
                <Receipt className="text-orange-500" />
                <span>{item.label}</span>
                {item.sub && (
                  <span className="ml-auto text-xs text-muted-foreground truncate">
                    {item.sub}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.prospects.length > 0 && (
          <CommandGroup heading="Prospects">
            {results.prospects.map((item) => (
              <CommandItem
                key={item.id}
                value={`prospect-${item.label}`}
                onSelect={() => handleSelect(item.href)}
              >
                <Megaphone className="text-purple-500" />
                <span className="truncate">{item.label}</span>
                {item.sub && (
                  <span className="ml-auto text-xs text-muted-foreground truncate">
                    {item.sub}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hasResults && <CommandSeparator />}

        <CommandGroup heading="Quick Actions">
          <CommandItem
            value="new-customer"
            onSelect={() => handleSelect("/customers/new")}
          >
            <Plus className="text-blue-500" />
            New Customer
          </CommandItem>
          <CommandItem
            value="new-job"
            onSelect={() => handleSelect("/jobs/new")}
          >
            <Plus className="text-green-500" />
            New Job
          </CommandItem>
          <CommandItem
            value="new-quote"
            onSelect={() => handleSelect("/quotes/new")}
          >
            <Plus className="text-purple-500" />
            New Quote
          </CommandItem>
          <CommandItem
            value="new-invoice"
            onSelect={() => handleSelect("/invoices/new")}
          >
            <Plus className="text-orange-500" />
            New Invoice
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
