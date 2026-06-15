import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validations/invoice";

async function nextInvoiceNumber(userId: string): Promise<string> {
  const count = await prisma.invoice.count({ where: { userId } });
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

function serializeInvoice(inv: {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  amount: { toString(): string };
  status: string;
  issueDate: Date;
  dueDate: Date;
  notes: string | null;
  createdAt: Date;
  client: { name: string; company: string | null };
  lineItems: { id: string; invoiceId: string; description: string; quantity: { toString(): string }; unitPrice: { toString(): string }; order: number }[];
}) {
  return {
    ...inv,
    amount: inv.amount.toString(),
    issueDate: inv.issueDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    lineItems: inv.lineItems.map((li) => ({
      ...li,
      quantity: li.quantity.toString(),
      unitPrice: li.unitPrice.toString(),
    })),
  };
}

const INVOICE_INCLUDE = {
  client: { select: { name: true, company: true } },
  lineItems: { orderBy: { order: "asc" as const } },
} as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit  = Math.min(Number(searchParams.get("limit") ?? "25"), 100);

  const [rawInvoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: session.user.id },
      include: INVOICE_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.invoice.count({ where: { userId: session.user.id } }),
  ]);

  const hasNextPage = rawInvoices.length > limit;
  const items       = hasNextPage ? rawInvoices.slice(0, limit) : rawInvoices;
  const nextCursor  = hasNextPage ? items[items.length - 1].id : null;

  return NextResponse.json({ items: items.map(serializeInvoice), nextCursor, totalCount });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body.invoiceNumber) {
    body.invoiceNumber = await nextInvoiceNumber(session.user.id);
  }

  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { invoiceNumber, clientId, lineItems, status, issueDate, dueDate, notes } = parsed.data;

  const client = await prisma.client.findFirst({ where: { id: clientId, userId: session.user.id } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const duplicate = await prisma.invoice.findFirst({ where: { invoiceNumber, userId: session.user.id } });
  if (duplicate) return NextResponse.json({ error: "Invoice number already in use" }, { status: 409 });

  const amount = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const invoice = await prisma.invoice.create({
    data: {
      userId: session.user.id,
      clientId,
      invoiceNumber,
      amount,
      status,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      notes: notes || null,
      lineItems: {
        create: lineItems.map((li, i) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          order: i,
        })),
      },
    },
    include: INVOICE_INCLUDE,
  });

  return NextResponse.json(serializeInvoice(invoice), { status: 201 });
}
