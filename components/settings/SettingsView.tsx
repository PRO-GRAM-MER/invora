"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { User, Building2, Phone, Mail, Calendar, Save, Loader2 } from "lucide-react";

// ─── Schema ─────────────────────────────────────────────────────────
const settingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  company: z.string().max(100, "Too long").optional().or(z.literal("")),
  phone: z
    .string()
    .max(20, "Too long")
    .regex(/^[+\d\s\-().]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
});

type FormData = z.infer<typeof settingsSchema>;

// ─── Types ───────────────────────────────────────────────────────────
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  createdAt: string;
};

type Props = { user: UserProfile };

// ─── Field wrapper ───────────────────────────────────────────────────
function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls =
  "block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

// ─── Component ───────────────────────────────────────────────────────
export function SettingsView({ user }: Props) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user.name,
      company: user.company ?? "",
      phone: user.phone ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to save");
      }

      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile. This info is used on generated invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main form — 2/3 width on lg */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile card */}
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Profile</h3>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                Shown in the &ldquo;From&rdquo; section of every PDF invoice
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
              <Field label="Full name" error={errors.name?.message} required>
                <input
                  {...register("name")}
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  className={inputCls}
                />
              </Field>

              <Field label="Company / Business name" error={errors.company?.message}>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    {...register("company")}
                    type="text"
                    autoComplete="organization"
                    placeholder="Acme Studio (optional)"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>

              <Field label="Phone number" error={errors.phone?.message}>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    {...register("phone")}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 (555) 000-0000 (optional)"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving || !isDirty}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Sidebar — account info */}
        <div className="space-y-4">
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold text-gray-900">Account</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{user.name}</p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-50 pt-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Member since</p>
                    <p className="text-sm text-gray-900">{memberSince}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 border-t border-gray-50 pt-3">
                Email changes require re-authentication. Contact support to update your email.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
