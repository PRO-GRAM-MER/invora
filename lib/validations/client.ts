import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  company: z.string().max(100, "Company name too long").optional().or(z.literal("")),
  phone: z
    .string()
    .max(20, "Phone number too long")
    .regex(/^[+\d\s\-().]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
});

export type ClientFormData = z.infer<typeof clientSchema>;
