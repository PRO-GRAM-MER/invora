"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X, FileText, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/lib/stores/searchStore";
import type { Invoice, InvoiceStatus } from "@/lib/stores/invoiceStore";
import type { Client } from "@/lib/stores/clientStore";
import { cn } from "@/lib/utils";

type InvoiceResult = { type: "invoice"; data: Invoice };
type ClientResult  = { type: "client";  data: Client };
type Result = InvoiceResult | ClientResult;

const STATUS_STYLE: Record<InvoiceStatus, { badge: string; dot: string; label: string }> = {
  PAID:    { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500", label: "Paid"    },
  PENDING: { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400",   label: "Pending" },
  OVERDUE: { badge: "bg-red-50 text-red-700 ring-1 ring-red-200",             dot: "bg-red-500",     label: "Overdue" },
};

// Context-aware placeholder text so users know what they can search
const PAGE_PLACEHOLDER: Record<string, string> = {
  invoices: "Search by invoice #, client name…",
  clients:  "Search by name, email, or company…",
  all:      "Search invoices & clients…",
};

// Footer hint per page
const PAGE_HINT: Record<string, string> = {
  invoices: "invoice #  ·  client name",
  clients:  "name  ·  email  ·  company",
  all:      "invoice #  ·  client name  ·  email",
};

function fmtAmount(amount: string) {
  return Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function GlobalSearch() {
  const pathname = usePathname();
  const router   = useRouter();
  const { setQuery, clear } = useSearchStore();

  const [isOpen,    setIsOpen]    = useState(false);
  const [localQ,    setLocalQ]    = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [results,   setResults]   = useState<Result[]>([]);

  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef     = useRef<AbortController | null>(null);

  const page =
    pathname === "/invoices" ? "invoices"
    : pathname === "/clients"  ? "clients"
    : "all";

  const placeholder = PAGE_PLACEHOLDER[page];
  const hint        = PAGE_HINT[page];

  // Clear everything on route change
  useEffect(() => {
    setLocalQ("");
    setResults([]);
    setIsLoading(false);
    setIsOpen(false);
    setActiveIdx(-1);
    clear();
  }, [pathname, clear]);

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 40);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside click
  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, []);

  // Debounced API search
  useEffect(() => {
    if (!localQ.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    abortRef.current?.abort();

    const t = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(localQ.trim())}&page=${page}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data: { invoices?: Invoice[]; clients?: Client[] } = await res.json();

        const out: Result[] = [
          ...(data.invoices ?? []).map((inv): InvoiceResult => ({ type: "invoice", data: inv })),
          ...(data.clients  ?? []).map((c):   ClientResult  => ({ type: "client",  data: c   })),
        ];

        setResults(out);
        setQuery(localQ.trim().toLowerCase()); // sync to page filter
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [localQ, page, setQuery]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const handleClear = useCallback(() => {
    setLocalQ("");
    setResults([]);
    setActiveIdx(-1);
    clear();
    abortRef.current?.abort();
    inputRef.current?.focus();
  }, [clear]);

  const handlePick = useCallback(
    (result: Result) => {
      setQuery(localQ.trim().toLowerCase());
      setIsOpen(false);
      setActiveIdx(-1);
      const target = result.type === "invoice" ? "/invoices" : "/clients";
      if (pathname !== target) router.push(target);
    },
    [localQ, pathname, router, setQuery]
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && results[activeIdx]) {
        handlePick(results[activeIdx]);
      } else {
        setQuery(localQ.trim().toLowerCase());
        setIsOpen(false);
        setActiveIdx(-1);
      }
    } else if (e.key === "Escape") {
      handleClear();
      setIsOpen(false);
    }
  }

  const showDropdown = isOpen && localQ.trim().length > 0;
  const invoiceResults = results.filter((r): r is InvoiceResult => r.type === "invoice");
  const clientResults  = results.filter((r): r is ClientResult  => r.type === "client");

  return (
    <div ref={containerRef} className="flex flex-1 justify-center px-3 sm:px-4">
      <div className="relative w-full max-w-sm sm:max-w-md">
        <AnimatePresence mode="wait" initial={false}>

          {/* ── Collapsed pill ─────────────────────────────────────────── */}
          {!isOpen && (
            <motion.button
              key="collapsed"
              onClick={handleOpen}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm transition-all hover:border-gray-300 hover:bg-white hover:shadow-sm"
            >
              <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span className="hidden flex-1 text-left text-xs text-gray-400 sm:block">{placeholder}</span>
              <kbd className="hidden rounded border border-gray-200 bg-white px-1 py-0.5 font-mono text-[10px] text-gray-400 sm:inline">
                ⌘K
              </kbd>
            </motion.button>
          )}

          {/* ── Expanded input ──────────────────────────────────────────── */}
          {isOpen && (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.13 }}
            >
              <div className="relative flex items-center">
                {/* Spinner while loading, search icon otherwise */}
                {isLoading ? (
                  <svg
                    className="pointer-events-none absolute left-3.5 h-4 w-4 animate-spin text-indigo-500"
                    fill="none" viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-indigo-500" />
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={localQ}
                  placeholder={placeholder}
                  onChange={(e) => { setLocalQ(e.target.value); setActiveIdx(-1); }}
                  onKeyDown={onKeyDown}
                  className="block w-full rounded-xl border border-indigo-300 bg-white py-2 pl-10 pr-9 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none ring-2 ring-indigo-500/20 focus:border-indigo-400 focus:ring-indigo-500/25"
                />

                {localQ && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 text-gray-400 transition-colors hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* ── Dropdown ─────────────────────────────────────────────── */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{   opacity: 0, y: -8, scale: 0.97  }}
                    transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-200"
                  >
                    {/* Empty state */}
                    {results.length === 0 && !isLoading && (
                      <div className="flex flex-col items-center py-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <Search className="h-5 w-5 text-gray-300" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-gray-500">
                          No results for &ldquo;{localQ}&rdquo;
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">Try: {hint}</p>
                      </div>
                    )}

                    {/* Results */}
                    {results.length > 0 && (
                      <ul className="py-1">
                        {/* Invoice section header (only on "all" page) */}
                        {page === "all" && invoiceResults.length > 0 && (
                          <li className="px-3 pb-1 pt-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              <FileText className="h-3 w-3" /> Invoices
                            </span>
                          </li>
                        )}

                        {invoiceResults.map((r) => {
                          const inv = r.data;
                          const s   = STATUS_STYLE[inv.status];
                          const idx = results.indexOf(r);
                          return (
                            <li key={inv.id}>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); handlePick(r); }}
                                className={cn(
                                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                                  idx === activeIdx ? "bg-indigo-50" : "hover:bg-gray-50"
                                )}
                              >
                                <span className="w-[76px] flex-shrink-0 font-mono text-xs font-semibold text-indigo-600">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-medium text-gray-900">{inv.client.name}</span>
                                  {inv.client.company && (
                                    <span className="block truncate text-xs text-gray-400">{inv.client.company}</span>
                                  )}
                                </span>
                                <span className="flex-shrink-0 font-semibold text-gray-800">
                                  ${fmtAmount(inv.amount)}
                                </span>
                                <span className={cn(
                                  "inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                  s.badge
                                )}>
                                  <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                                  {s.label}
                                </span>
                              </button>
                            </li>
                          );
                        })}

                        {/* Client section header (only on "all" page) */}
                        {page === "all" && clientResults.length > 0 && (
                          <li className={cn(
                            "px-3 pb-1 pt-2",
                            invoiceResults.length > 0 && "mt-1 border-t border-gray-100"
                          )}>
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              <Users className="h-3 w-3" /> Clients
                            </span>
                          </li>
                        )}

                        {clientResults.map((r) => {
                          const c   = r.data;
                          const idx = results.indexOf(r);
                          return (
                            <li key={c.id}>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); handlePick(r); }}
                                className={cn(
                                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                                  idx === activeIdx ? "bg-indigo-50" : "hover:bg-gray-50"
                                )}
                              >
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-medium text-gray-900">{c.name}</span>
                                  <span className="block truncate text-xs text-gray-400">{c.email}</span>
                                </span>
                                {c.company && (
                                  <span className="flex-shrink-0 truncate text-xs text-gray-400">{c.company}</span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Footer */}
                    <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-1.5">
                      {results.length > 0 ? (
                        <span className="text-xs text-gray-400">
                          {results.length} result{results.length !== 1 ? "s" : ""}
                          {" · "}↑↓ navigate · ↵ select · Esc close
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Search by {hint}</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
