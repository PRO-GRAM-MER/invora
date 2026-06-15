"use client";

import { useState, useRef } from "react";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { Invoice, InvoiceStatus } from "@/lib/stores/invoiceStore";
import { useSearchStore } from "@/lib/stores/searchStore";
import { InvoiceModal } from "./InvoiceModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceSummaryChart } from "./InvoiceSummaryChart";
import { FilterDropdown, type FilterOption } from "./FilterDropdown";
import { PageHeader } from "@/components/ui/PageHeader";
import type { InvoiceFormData } from "@/lib/validations/invoice";
import type { Client } from "@/lib/stores/clientStore";
import {
  Plus, FileText, AlertCircle, RefreshCw,
  CircleDot, CalendarDays, ArrowUpDown, X, SlidersHorizontal, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────
type StatusFilter = "ALL" | InvoiceStatus;
type DateRange    = "ALL" | "THIS_MONTH" | "LAST_3_MONTHS" | "THIS_YEAR";
type SortBy       = "NEWEST" | "OLDEST" | "AMOUNT_DESC" | "AMOUNT_ASC";
type InvoicePage  = { items: Invoice[]; nextCursor: string | null };

// ─── Filter option sets ───────────────────────────────────────────────
const STATUS_OPTIONS: FilterOption[] = [
  { value: "ALL",     label: "All statuses" },
  { value: "PENDING", label: "Pending", indicator: "bg-amber-400"   },
  { value: "PAID",    label: "Paid",    indicator: "bg-emerald-500" },
  { value: "OVERDUE", label: "Overdue", indicator: "bg-red-500"     },
];

const DATE_OPTIONS: FilterOption[] = [
  { value: "ALL",           label: "All time"      },
  { value: "THIS_MONTH",    label: "This month"    },
  { value: "LAST_3_MONTHS", label: "Last 3 months" },
  { value: "THIS_YEAR",     label: "This year"     },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "NEWEST",      label: "Newest first"       },
  { value: "OLDEST",      label: "Oldest first"       },
  { value: "AMOUNT_DESC", label: "Amount: High → Low" },
  { value: "AMOUNT_ASC",  label: "Amount: Low → High" },
];

// ─── Props ────────────────────────────────────────────────────────────
type Props = {
  initialInvoices:    Invoice[];
  initialNextCursor:  string | null;
  totalCount:         number;
  clients:            Pick<Client, "id" | "name" | "company">[];
};

export function InvoicesView({ initialInvoices, initialNextCursor, totalCount, clients }: Props) {
  const queryClient = useQueryClient();

  // ─── TanStack Query — infinite cursor pagination ──────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error: queryError,
    refetch,
  } = useInfiniteQuery<InvoicePage>({
    queryKey: ["invoices"],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | null;
      const url = cursor
        ? `/api/invoices?cursor=${cursor}&limit=25`
        : `/api/invoices?limit=25`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    initialData: {
      pages:      [{ items: initialInvoices, nextCursor: initialNextCursor }],
      pageParams: [null],
    } as InfiniteData<InvoicePage>,
  });

  const allInvoices = data?.pages.flatMap((p) => p.items) ?? [];

  // ─── Cache helpers ────────────────────────────────────────────────
  function patchCache(updater: (pages: InvoicePage[]) => InvoicePage[]) {
    queryClient.setQueryData<InfiniteData<InvoicePage>>(["invoices"], (old) => {
      if (!old) return old;
      return { ...old, pages: updater(old.pages) };
    });
  }

  // ─── Local invoice count (for next invoice number suggestion) ─────
  const [invoiceCount, setInvoiceCount] = useState(totalCount);
  const nextInvoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, "0")}`;

  // ─── Filter state ─────────────────────────────────────────────────
  const { query: search, clear: clearSearch } = useSearchStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateRange,    setDateRange]    = useState<DateRange>("ALL");
  const [sortBy,       setSortBy]       = useState<SortBy>("NEWEST");

  // ─── Modal state ──────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [isDeleting,   setIsDeleting]   = useState(false);

  // ─── Derived: filtered + sorted list ─────────────────────────────
  const q = search.trim().toLowerCase();

  const now = new Date();
  const dateThreshold: Date | null =
    dateRange === "THIS_MONTH"     ? new Date(now.getFullYear(), now.getMonth(), 1)
    : dateRange === "LAST_3_MONTHS" ? new Date(now.getFullYear(), now.getMonth() - 2, 1)
    : dateRange === "THIS_YEAR"     ? new Date(now.getFullYear(), 0, 1)
    : null;

  let filtered = allInvoices
    .filter((inv) => statusFilter === "ALL" || inv.status === statusFilter)
    .filter((inv) => !dateThreshold || new Date(inv.issueDate) >= dateThreshold)
    .filter((inv) =>
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.client.name.toLowerCase().includes(q) ||
      (inv.client.company ?? "").toLowerCase().includes(q) ||
      inv.amount.includes(q)
    );

  if (sortBy === "OLDEST")       filtered = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  else if (sortBy === "AMOUNT_DESC") filtered = [...filtered].sort((a, b) => Number(b.amount) - Number(a.amount));
  else if (sortBy === "AMOUNT_ASC")  filtered = [...filtered].sort((a, b) => Number(a.amount) - Number(b.amount));

  const activeFilterCount = (statusFilter !== "ALL" ? 1 : 0) + (dateRange !== "ALL" ? 1 : 0) + (sortBy !== "NEWEST" ? 1 : 0);

  function clearAll() {
    clearSearch();
    setStatusFilter("ALL");
    setDateRange("ALL");
    setSortBy("NEWEST");
  }

  // ─── Drag-to-scroll for filter strip ─────────────────────────────
  const filterStripRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });

  function onFilterDragStart(e: React.MouseEvent) {
    const el = filterStripRef.current;
    if (!el) return;
    drag.current = { active: true, moved: false, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
  }
  function onFilterDragMove(e: React.MouseEvent) {
    if (!drag.current.active) return;
    const el = filterStripRef.current;
    if (!el) return;
    const delta = (e.pageX - el.offsetLeft - drag.current.startX) * 1.4;
    if (Math.abs(delta) > 5) { drag.current.moved = true; el.scrollLeft = drag.current.scrollLeft - delta; }
  }
  function onFilterDragEnd() { drag.current.active = false; }
  function onFilterClick(e: React.MouseEvent) {
    if (drag.current.moved) { e.stopPropagation(); drag.current.moved = false; }
  }

  // ─── Create / Update ──────────────────────────────────────────────
  async function handleSubmit(data: InvoiceFormData) {
    setIsSubmitting(true);
    const isEdit = !!editTarget;
    const url    = isEdit ? `/api/invoices/${editTarget!.id}` : "/api/invoices";
    const method = isEdit ? "PUT" : "POST";
    const clientInfo = clients.find((c) => c.id === data.clientId);
    const computedAmount = data.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0).toFixed(2);

    let previousData: InfiniteData<InvoicePage> | undefined;

    if (isEdit) {
      previousData = queryClient.getQueryData<InfiniteData<InvoicePage>>(["invoices"]);
      const optimisticUpdate: Partial<Invoice> = {
        clientId:  data.clientId,
        status:    data.status,
        amount:    computedAmount,
        issueDate: new Date(data.issueDate).toISOString(),
        dueDate:   new Date(data.dueDate).toISOString(),
        notes:     data.notes || null,
        client:    clientInfo ? { name: clientInfo.name, company: clientInfo.company ?? null } : editTarget!.client,
      };
      patchCache((pages) =>
        pages.map((page) => ({
          ...page,
          items: page.items.map((inv) =>
            inv.id === editTarget!.id ? { ...inv, ...optimisticUpdate } : inv
          ),
        }))
      );
    }

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? "Request failed"); }
      const saved: Invoice = await res.json();

      if (isEdit) {
        patchCache((pages) =>
          pages.map((page) => ({
            ...page,
            items: page.items.map((inv) => inv.id === saved.id ? saved : inv),
          }))
        );
        toast.success("Invoice updated");
      } else {
        patchCache((pages) => [
          { ...pages[0], items: [saved, ...pages[0].items] },
          ...pages.slice(1),
        ]);
        setInvoiceCount((c) => c + 1);
        toast.success("Invoice created");
      }

      setModalOpen(false);
      setEditTarget(null);
    } catch (err) {
      if (isEdit && previousData) queryClient.setQueryData(["invoices"], previousData);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const previousData = queryClient.getQueryData<InfiniteData<InvoicePage>>(["invoices"]);
    patchCache((pages) =>
      pages.map((page) => ({
        ...page,
        items: page.items.filter((inv) => inv.id !== deleteTarget.id),
      }))
    );

    try {
      const res = await fetch(`/api/invoices/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setInvoiceCount((c) => c - 1);
      setDeleteTarget(null);
      toast.success("Invoice deleted");
    } catch {
      if (previousData) queryClient.setQueryData(["invoices"], previousData);
      toast.error("Could not delete invoice. Please try again.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // ─── Table footer: load more ──────────────────────────────────────
  const tableFooter = hasNextPage ? (
    <div className="px-5 py-4 text-center">
      <button
        onClick={() => fetchNextPage()}
        disabled={isFetchingNextPage}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-all",
          "hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isFetchingNextPage ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Loading…</>
        ) : (
          <>Load more invoices</>
        )}
      </button>
    </div>
  ) : null;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── ROW 1: Back + Title + New Invoice ───────────────────────── */}
      <PageHeader
        title="Invoices"
        action={
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
          </button>
        }
      />

      {/* ── ROW 2: Summary chart ─────────────────────────────────────── */}
      <InvoiceSummaryChart invoices={allInvoices} clientCount={clients.length} />

      {/* ── ROW 3: Filter strip ──────────────────────────────────────── */}
      <div className="flex overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-shrink-0 items-center gap-1.5 border-r border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm font-semibold text-gray-600 select-none">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
          <span className="hidden sm:inline">Filters</span>
        </div>
        <div
          ref={filterStripRef}
          className="flex flex-1 cursor-grab items-center gap-0.5 overflow-x-auto px-2 py-2 active:cursor-grabbing select-none"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          onMouseDown={onFilterDragStart}
          onMouseMove={onFilterDragMove}
          onMouseUp={onFilterDragEnd}
          onMouseLeave={onFilterDragEnd}
          onClickCapture={onFilterClick}
        >
          <FilterDropdown
            label="Status"
            icon={<CircleDot className="h-3.5 w-3.5" />}
            options={STATUS_OPTIONS}
            value={statusFilter}
            defaultValue="ALL"
            onChange={(v) => setStatusFilter(v as StatusFilter)}
          />
          <FilterDropdown
            label="Duration"
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            options={DATE_OPTIONS}
            value={dateRange}
            defaultValue="ALL"
            onChange={(v) => setDateRange(v as DateRange)}
          />
          <FilterDropdown
            label="Sort"
            icon={<ArrowUpDown className="h-3.5 w-3.5" />}
            options={SORT_OPTIONS}
            value={sortBy}
            defaultValue="NEWEST"
            onChange={(v) => setSortBy(v as SortBy)}
          />
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85, x: -6 }}
                animate={{ opacity: 1, scale: 1,    x: 0   }}
                exit={{   opacity: 0, scale: 0.85, x: -6   }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                onClick={clearAll}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
                Clear
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-100 px-1 text-[10px] font-bold text-indigo-700">
                  {activeFilterCount}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────── */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="flex-1 text-sm text-red-700">
            {queryError instanceof Error ? queryError.message : "Could not load invoices."}
          </p>
          <button onClick={() => refetch()} className="text-xs font-medium text-red-600 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* ── Empty — no invoices at all ───────────────────────────────── */}
      {allInvoices.length === 0 && !isError && (
        <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <FileText className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">No invoices yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {clients.length === 0
              ? "Add a client first, then create your first invoice."
              : "Create your first invoice to start tracking payments."}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            disabled={clients.length === 0}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New invoice
          </button>
        </div>
      )}

      {/* ── Empty filtered ───────────────────────────────────────────── */}
      {allInvoices.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl bg-white py-16 text-center border border-gray-100 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
            <SlidersHorizontal className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-900">No results</p>
          <p className="mt-1 text-xs text-gray-500">
            {q ? `Nothing matches "${search}"` : "No invoices match the current filters."}
          </p>
          <button onClick={clearAll} className="mt-4 text-xs font-medium text-indigo-600 hover:underline">
            Clear all filters
          </button>
        </div>
      )}

      {/* ── ROW 4: Table ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <InvoiceTable
          invoices={filtered}
          onEdit={(inv) => { setEditTarget(inv); setModalOpen(true); }}
          onDelete={(inv) => setDeleteTarget(inv)}
          footer={tableFooter}
        />
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      <InvoiceModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSubmit={handleSubmit}
        editTarget={editTarget}
        clients={clients}
        nextInvoiceNumber={nextInvoiceNumber}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete invoice"
        description={`Delete invoice ${deleteTarget?.invoiceNumber}? This cannot be undone.`}
        confirmLabel="Delete invoice"
        isLoading={isDeleting}
      />
    </div>
  );
}
