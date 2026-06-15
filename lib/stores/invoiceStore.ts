import { create } from "zustand";

export type InvoiceStatus = "PENDING" | "PAID" | "OVERDUE";

export type LineItem = {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  order: number;
};

export type Invoice = {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  amount: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  createdAt: string;
  client: { name: string; company: string | null };
  lineItems: LineItem[];
};

type InvoiceStore = {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;

  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useInvoiceStore = create<InvoiceStore>((set) => ({
  invoices: [],
  isLoading: false,
  error: null,

  setInvoices: (invoices) => set({ invoices }),
  addInvoice: (invoice) =>
    set((s) => ({ invoices: [invoice, ...s.invoices] })),
  updateInvoice: (id, data) =>
    set((s) => ({
      invoices: s.invoices.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)),
    })),
  removeInvoice: (id) =>
    set((s) => ({ invoices: s.invoices.filter((inv) => inv.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
