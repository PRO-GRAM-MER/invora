import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoicesView } from "@/components/invoices/InvoicesView";
import type { Metadata } from "next";
import type { Invoice } from "@/lib/stores/invoiceStore";
import type { Client } from "@/lib/stores/clientStore";

export const metadata: Metadata = { title: "Invoices" };

const PAGE_SIZE = 25;

export default async function InvoicesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [rawInvoices, totalCount, rawClients] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId },
      include: {
        client: { select: { name: true, company: true } },
        lineItems: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
    }),
    prisma.invoice.count({ where: { userId } }),
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasNextPage  = rawInvoices.length > PAGE_SIZE;
  const pageItems    = hasNextPage ? rawInvoices.slice(0, PAGE_SIZE) : rawInvoices;
  const nextCursor   = hasNextPage ? pageItems[pageItems.length - 1].id : null;

  const invoices: Invoice[] = pageItems.map((inv) => ({
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
  }));

  const clients: Pick<Client, "id" | "name" | "company">[] = rawClients.map((c) => ({
    id:      c.id,
    name:    c.name,
    company: c.company,
  }));

  return (
    <InvoicesView
      initialInvoices={invoices}
      initialNextCursor={nextCursor}
      totalCount={totalCount}
      clients={clients}
    />
  );
}
