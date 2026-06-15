import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INVOICE_INCLUDE = {
  client: { select: { name: true, company: true } },
  lineItems: { orderBy: { order: "asc" as const } },
} as const;

function serializeInvoice(inv: {
  id: string; userId: string; clientId: string; invoiceNumber: string;
  amount: { toString(): string }; status: string;
  issueDate: Date; dueDate: Date; notes: string | null; createdAt: Date;
  client: { name: string; company: string | null };
  lineItems: { id: string; invoiceId: string; description: string; quantity: { toString(): string }; unitPrice: { toString(): string }; order: number }[];
}) {
  return {
    ...inv,
    amount:    inv.amount.toString(),
    issueDate: inv.issueDate.toISOString(),
    dueDate:   inv.dueDate.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    lineItems: inv.lineItems.map((li) => ({
      ...li,
      quantity:  li.quantity.toString(),
      unitPrice: li.unitPrice.toString(),
    })),
  };
}

function serializeClient(c: {
  id: string; userId: string; name: string; email: string;
  company: string | null; phone: string | null; createdAt: Date;
}) {
  return { ...c, createdAt: c.createdAt.toISOString() };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q    = (searchParams.get("q") ?? "").trim();
  const page = searchParams.get("page") ?? "all"; // "invoices" | "clients" | "all"

  if (!q) return NextResponse.json({ invoices: [], clients: [] });

  const userId = session.user.id;
  const limit  = page === "all" ? 4 : 8;

  const [rawInvoices, rawClients] = await Promise.all([
    page === "invoices" || page === "all"
      ? prisma.invoice.findMany({
          where: {
            userId,
            OR: [
              { invoiceNumber: { contains: q, mode: "insensitive" } },
              { client: { name:    { contains: q, mode: "insensitive" } } },
              { client: { company: { contains: q, mode: "insensitive" } } },
            ],
          },
          include: INVOICE_INCLUDE,
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : Promise.resolve([]),

    page === "clients" || page === "all"
      ? prisma.client.findMany({
          where: {
            userId,
            OR: [
              { name:    { contains: q, mode: "insensitive" } },
              { email:   { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    invoices: rawInvoices.map(serializeInvoice),
    clients:  rawClients.map(serializeClient),
  });
}
