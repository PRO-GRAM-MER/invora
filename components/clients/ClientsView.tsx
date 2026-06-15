"use client";

import { useEffect, useState, useCallback } from "react";
import { useClientStore, type Client } from "@/lib/stores/clientStore";
import { useSearchStore } from "@/lib/stores/searchStore";
import { ClientModal } from "./ClientModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { ClientFormData } from "@/lib/validations/client";
import {
  Plus, Users, AlertCircle, RefreshCw, Search,
} from "lucide-react";
import { ClientTable } from "./ClientTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";

type Props = {
  initialClients: Client[];
};

export function ClientsView({ initialClients }: Props) {
  const { clients, isLoading, error, setClients, addClient, updateClient, removeClient, setLoading, setError } =
    useClientStore();

  // Hydrate store from server-fetched data on mount
  useEffect(() => {
    setClients(initialClients);
  }, [initialClients, setClients]);

  const { query: search, clear: clearSearch } = useSearchStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.company ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q)
      )
    : clients;

  // ─── Fetch / refresh ───────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      setClients(await res.json());
    } catch {
      setError("Could not load clients. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [setClients, setLoading, setError]);

  // ─── Create / Update ───────────────────────────────────────────────
  async function handleSubmit(data: ClientFormData) {
    setIsSubmitting(true);

    const isEdit = !!editTarget;
    const url = isEdit ? `/api/clients/${editTarget!.id}` : "/api/clients";
    const method = isEdit ? "PUT" : "POST";

    if (isEdit) {
      updateClient(editTarget!.id, {
        name: data.name,
        email: data.email,
        company: data.company || null,
        phone: data.phone || null,
      });
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Request failed");
      }

      const saved: Client = await res.json();

      if (isEdit) {
        updateClient(saved.id, saved);
        toast.success("Client updated");
      } else {
        addClient(saved);
        toast.success("Client created");
      }

      setModalOpen(false);
      setEditTarget(null);
    } catch (err) {
      if (isEdit) updateClient(editTarget!.id, editTarget!);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    removeClient(deleteTarget.id);

    try {
      const res = await fetch(`/api/clients/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeleteTarget(null);
      toast.success("Client deleted");
    } catch {
      addClient(deleteTarget);
      toast.error("Could not delete client. Please try again.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  function openAdd() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditTarget(client);
    setModalOpen(true);
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── ROW 1: Back + Title + Add Client ─────────────────────────── */}
      <PageHeader
        title="Clients"
        action={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        }
      />

      {/* ── ROW 2: Total Clients stat ────────────────────────────────── */}
      {clients.length > 0 && (
        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
          <Users className="h-4 w-4 flex-shrink-0 text-indigo-400" />
          <span className="text-sm font-medium text-gray-500">Total Clients</span>
          <span className="text-sm font-bold text-gray-900">
            {q ? `${filtered.length} / ${clients.length}` : clients.length}
          </span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="flex-1 text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && clients.length === 0 && !error && (
        <div className="rounded-2xl bg-white py-20 text-center border border-gray-100 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <Users className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">No clients yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your first client to start sending invoices.
          </p>
          <button
            onClick={openAdd}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add your first client
          </button>
        </div>
      )}

      {/* Error state with refresh */}
      {!isLoading && error && clients.length === 0 && (
        <div className="rounded-2xl bg-white py-20 text-center border border-gray-100 shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">Failed to load clients</h3>
          <button
            onClick={fetchClients}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* No search results */}
      {!isLoading && clients.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl bg-white py-16 text-center border border-gray-100 shadow-sm">
          <Search className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No clients match &ldquo;{search}&rdquo;</p>
          <button
            onClick={clearSearch}
            className="mt-3 text-xs font-medium text-indigo-600 hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && filtered.length > 0 && (
        <ClientTable
          clients={filtered}
          onEdit={openEdit}
          onDelete={(client) => setDeleteTarget(client)}
        />
      )}

      {/* Modals */}
      <ClientModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSubmit={handleSubmit}
        editTarget={editTarget}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete client"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone. Any linked invoices will also be removed.`}
        confirmLabel="Delete client"
        isLoading={isDeleting}
      />
    </div>
  );
}
