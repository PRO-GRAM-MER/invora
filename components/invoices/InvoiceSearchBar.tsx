"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import type { Invoice, InvoiceStatus } from "@/lib/stores/invoiceStore";

const STATUS_STYLE: Record<InvoiceStatus, { badge: string; dot: string; label: string }> = {
  PAID:    { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500", label: "Paid" },
  PENDING: { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400",   label: "Pending" },
  OVERDUE: { badge: "bg-red-50 text-red-700 ring-1 ring-red-200",             dot: "bg-red-500",     label: "Overdue" },
};

function fmt(amount: string) {
  return Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  invoices: Invoice[];
};

export function InvoiceSearchBar({ value, onChange, invoices }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce propagation to parent
  useEffect(() => {
    const t = setTimeout(() => onChange(query), 300);
    return () => clearTimeout(t);
  }, [query, onChange]);

  // Parent reset (e.g. clear all)
  useEffect(() => {
    if (value === "" && query !== "") setQuery("");
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = query.trim().toLowerCase();

  const suggestions = q.length === 0
    ? []
    : invoices
        .filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.client.name.toLowerCase().includes(q) ||
            (inv.client.company ?? "").toLowerCase().includes(q)
        )
        .slice(0, 8);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const pick = useCallback(
    (inv: Invoice) => {
      setQuery(inv.invoiceNumber);
      onChange(inv.invoiceNumber);
      setOpen(false);
      setActiveIdx(-1);
    },
    [onChange]
  );

  function clear() {
    setQuery("");
    onChange("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0 && suggestions[activeIdx]) {
      e.preventDefault();
      pick(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  const showSuggestions = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {/* Input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by invoice #, client name…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => { if (q) setOpen(true); }}
          onKeyDown={onKeyDown}
          className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions panel */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-gray-100/50">
          <ul>
            {suggestions.map((inv, i) => {
              const s = STATUS_STYLE[inv.status];
              return (
                <li key={inv.id}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); pick(inv); }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === activeIdx ? "bg-indigo-50" : "hover:bg-gray-50"
                    } ${i > 0 ? "border-t border-gray-50" : ""}`}
                  >
                    {/* Invoice # */}
                    <span className="w-20 flex-shrink-0 font-mono text-xs font-semibold text-indigo-600">
                      {inv.invoiceNumber}
                    </span>

                    {/* Client */}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {inv.client.name}
                      </span>
                      {inv.client.company && (
                        <span className="block truncate text-xs text-gray-400">
                          {inv.client.company}
                        </span>
                      )}
                    </span>

                    {/* Amount */}
                    <span className="flex-shrink-0 text-sm font-semibold text-gray-800">
                      ${fmt(inv.amount)}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-1.5">
            <span className="text-xs text-gray-400">
              {suggestions.length} result{suggestions.length !== 1 ? "s" : ""}
              {activeIdx >= 0 ? " · ↵ to select" : " · ↑↓ to navigate"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
