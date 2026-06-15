"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations/invoice";
import type { Invoice } from "@/lib/stores/invoiceStore";
import type { Client } from "@/lib/stores/clientStore";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  editTarget?: Invoice | null;
  clients: Pick<Client, "id" | "name" | "company">[];
  nextInvoiceNumber: string;
  isSubmitting: boolean;
};

function toDateInput(iso: string) {
  return iso ? iso.slice(0, 10) : "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_LINE_ITEM = {
  description: "",
  quantity: undefined as unknown as number,
  unitPrice: undefined as unknown as number,
};

const statusOptions: { value: InvoiceFormData["status"]; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
];

const inputClass =
  "block w-full rounded-xl border bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2";
const validClass = "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20";
const errorClass = "border-red-300 focus:border-red-400 focus:ring-red-500/20";

export function InvoiceModal({
  open,
  onClose,
  onSubmit,
  editTarget,
  clients,
  nextInvoiceNumber,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: nextInvoiceNumber,
      clientId: "",
      lineItems: [DEFAULT_LINE_ITEM],
      status: "PENDING",
      issueDate: today(),
      dueDate: plusDays(30),
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const lineItems = watch("lineItems");
  const total = (lineItems ?? []).reduce(
    (sum, li) => sum + (Number(li.quantity) || 0) * (Number(li.unitPrice) || 0),
    0
  );

  useEffect(() => {
    if (editTarget) {
      reset({
        invoiceNumber: editTarget.invoiceNumber,
        clientId: editTarget.clientId,
        lineItems:
          editTarget.lineItems && editTarget.lineItems.length > 0
            ? editTarget.lineItems.map((li) => ({
                description: li.description,
                quantity: Number(li.quantity),
                unitPrice: Number(li.unitPrice),
              }))
            : [DEFAULT_LINE_ITEM],
        status: editTarget.status,
        issueDate: toDateInput(editTarget.issueDate),
        dueDate: toDateInput(editTarget.dueDate),
        notes: editTarget.notes ?? "",
      });
    } else {
      reset({
        invoiceNumber: nextInvoiceNumber,
        clientId: "",
        lineItems: [DEFAULT_LINE_ITEM],
        status: "PENDING",
        issueDate: today(),
        dueDate: plusDays(30),
        notes: "",
      });
    }
  }, [editTarget, nextInvoiceNumber, reset, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTarget ? "Edit invoice" : "New invoice"}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Invoice # + Client */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Invoice number <span className="text-red-500">*</span>
            </label>
            <input
              {...register("invoiceNumber")}
              placeholder="INV-0001"
              className={`mt-1.5 ${inputClass} ${errors.invoiceNumber ? errorClass : validClass}`}
            />
            {errors.invoiceNumber && (
              <p className="mt-1 text-xs text-red-500">{errors.invoiceNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              {...register("clientId")}
              className={`mt-1.5 ${inputClass} ${errors.clientId ? errorClass : validClass}`}
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` — ${c.company}` : ""}
                </option>
              ))}
            </select>
            {clients.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">No clients yet — add one first.</p>
            )}
            {errors.clientId && (
              <p className="mt-1 text-xs text-red-500">{errors.clientId.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Status + Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("status")}
              className={`mt-1.5 ${inputClass} ${errors.status ? errorClass : validClass}`}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Issue date <span className="text-red-500">*</span>
            </label>
            <input
              {...register("issueDate")}
              type="date"
              className={`mt-1.5 ${inputClass} ${errors.issueDate ? errorClass : validClass}`}
            />
            {errors.issueDate && (
              <p className="mt-1 text-xs text-red-500">{errors.issueDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due date <span className="text-red-500">*</span>
            </label>
            <input
              {...register("dueDate")}
              type="date"
              className={`mt-1.5 ${inputClass} ${errors.dueDate ? errorClass : validClass}`}
            />
            {errors.dueDate && (
              <p className="mt-1 text-xs text-red-500">{errors.dueDate.message}</p>
            )}
          </div>
        </div>

        {/* Line items */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Line items <span className="text-red-500">*</span>
            </label>
          </div>

          {/* Header row */}
          <div className="mb-1 hidden grid-cols-[1fr_80px_100px_32px] gap-2 sm:grid">
            <span className="text-xs font-medium text-gray-500">Description</span>
            <span className="text-xs font-medium text-gray-500">Qty</span>
            <span className="text-xs font-medium text-gray-500">Unit price</span>
            <span />
          </div>

          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_80px_100px_32px] items-start">
                <div>
                  <input
                    {...register(`lineItems.${i}.description`)}
                    placeholder="Description…"
                    className={`${inputClass} ${errors.lineItems?.[i]?.description ? errorClass : validClass}`}
                  />
                  {errors.lineItems?.[i]?.description && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {errors.lineItems[i]?.description?.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...register(`lineItems.${i}.quantity`, { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="1"
                    className={`${inputClass} ${errors.lineItems?.[i]?.quantity ? errorClass : validClass}`}
                  />
                  {errors.lineItems?.[i]?.quantity && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {errors.lineItems[i]?.quantity?.message}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    $
                  </span>
                  <input
                    {...register(`lineItems.${i}.unitPrice`, { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className={`${inputClass} pl-7 ${errors.lineItems?.[i]?.unitPrice ? errorClass : validClass}`}
                  />
                  {errors.lineItems?.[i]?.unitPrice && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {errors.lineItems[i]?.unitPrice?.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                  className="flex h-[42px] w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
                  title="Remove line item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {errors.lineItems && !Array.isArray(errors.lineItems) && (
            <p className="mt-1 text-xs text-red-500">{(errors.lineItems as { message?: string }).message}</p>
          )}

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => append(DEFAULT_LINE_ITEM)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add line item
            </button>

            <div className="text-right">
              <span className="text-xs text-gray-500">Total: </span>
              <span className="text-sm font-bold text-gray-900">
                ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            {...register("notes")}
            rows={2}
            placeholder="Payment terms, project details… (optional)"
            className={`mt-1.5 ${inputClass} resize-none ${errors.notes ? errorClass : validClass}`}
          />
          {errors.notes && (
            <p className="mt-1 text-xs text-red-500">{errors.notes.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || clients.length === 0}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting
              ? editTarget ? "Saving…" : "Creating…"
              : editTarget ? "Save changes" : "Create invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
