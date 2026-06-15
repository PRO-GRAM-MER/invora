import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validations/invoice";

async function getOwnedInvoice(id: string, userId: string) {
  return prisma.invoice.findFirst({ where: { id, userId } });
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedInvoice(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
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

  const duplicate = await prisma.invoice.findFirst({
    where: { invoiceNumber, userId: session.user.id, NOT: { id } },
  });
  if (duplicate) return NextResponse.json({ error: "Invoice number already in use" }, { status: 409 });

  const amount = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.lineItem.deleteMany({ where: { invoiceId: id } });

    return tx.invoice.update({
      where: { id },
      data: {
        invoiceNumber,
        clientId,
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
  });

  return NextResponse.json(serializeInvoice(updated));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedInvoice(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
