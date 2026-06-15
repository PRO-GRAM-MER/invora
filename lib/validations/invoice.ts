import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description required").max(200, "Too long"),
  quantity: z
    .number({ message: "Enter a valid quantity" })
    .positive("Must be > 0")
    .max(99999, "Too large"),
  unitPrice: z
    .number({ message: "Enter a valid price" })
    .positive("Must be > 0")
    .max(9999999, "Too large"),
});

export const invoiceSchema = z
  .object({
    invoiceNumber: z.string().min(1, "Invoice number is required").max(50),
    clientId: z.string().min(1, "Please select a client"),
    lineItems: z
      .array(lineItemSchema)
      .min(1, "Add at least one line item"),
    status: z.enum(["PENDING", "PAID", "OVERDUE"]),
    issueDate: z.string().min(1, "Issue date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    notes: z.string().max(1000, "Notes too long").optional().or(z.literal("")),
  })
  .refine((d) => new Date(d.dueDate) >= new Date(d.issueDate), {
    message: "Due date must be on or after issue date",
    path: ["dueDate"],
  });

export type LineItemFormData = z.infer<typeof lineItemSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
