"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import type { Client } from "@/lib/stores/clientStore";

// ── Column helper ──────────────────────────────────────────────────────
const colHelper = createColumnHelper<Client>();

// ── Props ──────────────────────────────────────────────────────────────
type Props = {
  clients:  Client[];
  onEdit:   (client: Client) => void;
  onDelete: (client: Client) => void;
};

export function ClientTable({ clients, onEdit, onDelete }: Props) {
  const columns = [
    colHelper.display({
      id: "name",
      header: "Client",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <span className="whitespace-nowrap font-medium text-gray-900">{row.original.name}</span>
        </div>
      ),
    }),
    colHelper.accessor("email", {
      header: "Email",
      cell: (info) => (
        <span className="whitespace-nowrap text-sm text-gray-600">{info.getValue()}</span>
      ),
    }),
    colHelper.accessor("company", {
      header: "Company",
      cell: (info) => (
        <span className="text-sm text-gray-600">{info.getValue() ?? "—"}</span>
      ),
    }),
    colHelper.accessor("phone", {
      header: "Phone",
      cell: (info) => (
        <span className="whitespace-nowrap text-sm text-gray-600">{info.getValue() ?? "—"}</span>
      ),
    }),
    colHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5">
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
    data: clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
    </div>
  );
}
