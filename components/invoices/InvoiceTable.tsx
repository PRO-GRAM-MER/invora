"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/lib/stores/invoiceStore";

// ── Helpers ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<InvoiceStatus, { label: string; class: string; dot: string }> = {
  PAID:    { label: "Paid",    class: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  PENDING: { label: "Pending", class: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400"   },
  OVERDUE: { label: "Overdue", class: "bg-red-50 text-red-700 ring-1 ring-red-200",             dot: "bg-red-500"     },
};

function fmtAmount(amount: string) {
  return Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdueUnpaid(inv: Invoice) {
  return inv.status !== "PAID" && new Date(inv.dueDate) < new Date();
}

// ── Column helper ──────────────────────────────────────────────────────
const colHelper = createColumnHelper<Invoice>();

// ── Props ──────────────────────────────────────────────────────────────
type Props = {
  invoices: Invoice[];
  onEdit:   (inv: Invoice) => void;
  onDelete: (inv: Invoice) => void;
  /** Footer slot — e.g. "Load more" button */
  footer?: React.ReactNode;
};

export function InvoiceTable({ invoices, onEdit, onDelete, footer }: Props) {
  const columns = [
    colHelper.accessor("invoiceNumber", {
      header: "Invoice",
      cell: (info) => (
        <span className="whitespace-nowrap font-mono text-sm font-semibold text-indigo-600">
          {info.getValue()}
        </span>
      ),
    }),
    colHelper.display({
      id: "client",
      header: "Client",
      cell: ({ row }) => (
        <div className="min-w-[128px]">
          <p className="text-sm font-medium text-gray-900">{row.original.client.name}</p>
          {row.original.client.company && (
            <p className="text-xs text-gray-400">{row.original.client.company}</p>
          )}
        </div>
      ),
    }),
    colHelper.accessor("amount", {
      header: "Amount",
      cell: (info) => (
        <span className="whitespace-nowrap text-sm font-bold text-gray-900">
          ${fmtAmount(info.getValue())}
        </span>
      ),
    }),
    colHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const cfg = STATUS_CFG[info.getValue()];
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
            cfg.class,
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", cfg.dot)} />
            {cfg.label}
          </span>
        );
      },
    }),
    colHelper.accessor("issueDate", {
      header: "Issue Date",
      cell: (info) => (
        <span className="whitespace-nowrap text-sm text-gray-600">
          {fmtDate(info.getValue())}
        </span>
      ),
    }),
    colHelper.accessor("dueDate", {
      header: "Due Date",
      cell: ({ row, getValue }) => {
        const overdue = isOverdueUnpaid(row.original);
        return (
          <span className={cn(
            "whitespace-nowrap text-sm font-medium",
            overdue ? "text-red-500" : "text-gray-600",
          )}>
            {fmtDate(getValue())}
          </span>
        );
      },
    }),
    colHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5">
          <DownloadPdfButton invoiceId={row.original.id} invoiceNumber={row.original.invoiceNumber} />
          <button
            onClick={() => onEdit(row.original)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(row.original)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Horizontal scroll wrapper */}
      <div
        className="overflow-x-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
      >
        <table className="min-w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-100 bg-gray-50/60">
                {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-indigo-50/20">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footer && (
        <div className="border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
}
