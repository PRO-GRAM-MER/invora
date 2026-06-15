"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { clientSchema, type ClientFormData } from "@/lib/validations/client";
import type { Client } from "@/lib/stores/clientStore";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
  editTarget?: Client | null;
  isSubmitting: boolean;
};

const fields: Array<{
  name: keyof ClientFormData;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
}> = [
  { name: "name", label: "Full name", type: "text", placeholder: "Jane Smith", required: true },
  { name: "email", label: "Email address", type: "email", placeholder: "jane@example.com", required: true },
  { name: "company", label: "Company", type: "text", placeholder: "Acme Inc. (optional)" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "+1 555 000 0000 (optional)" },
];

export function ClientModal({ open, onClose, onSubmit, editTarget, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", company: "", phone: "" },
  });

  // Populate form when editing, clear when adding
  useEffect(() => {
    if (editTarget) {
      reset({
        name: editTarget.name,
        email: editTarget.email,
        company: editTarget.company ?? "",
        phone: editTarget.phone ?? "",
      });
    } else {
      reset({ name: "", email: "", company: "", phone: "" });
    }
  }, [editTarget, reset, open]);

  async function handleFormSubmit(data: ClientFormData) {
    await onSubmit(data);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTarget ? "Edit client" : "Add new client"}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {fields.map(({ name, label, type, placeholder, required }) => (
          <div key={name}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
              {label}
              {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            <input
              id={name}
              type={type}
              placeholder={placeholder}
              autoComplete="off"
              {...register(name)}
              className={`mt-1.5 block w-full rounded-xl border bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
                errors[name]
                  ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
              }`}
            />
            {errors[name] && (
              <p className="mt-1 text-xs text-red-500">{errors[name]?.message}</p>
            )}
          </div>
        ))}

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
            disabled={isSubmitting}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting
              ? editTarget ? "Saving…" : "Adding…"
              : editTarget ? "Save changes" : "Add client"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
