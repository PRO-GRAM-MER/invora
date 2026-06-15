import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { InvoiceDocument } from "@/lib/pdf/InvoiceDocument";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: {
      client: { select: { name: true, email: true, company: true, phone: true } },
      user: { select: { name: true, email: true, company: true, phone: true } },
      lineItems: { orderBy: { order: "asc" } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lineItems = invoice.lineItems.length > 0
    ? invoice.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity.toString(),
        unitPrice: li.unitPrice.toString(),
      }))
    : [{ description: "Services", quantity: "1", unitPrice: invoice.amount.toString() }];

  const data = {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status as "PENDING" | "PAID" | "OVERDUE",
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    amount: invoice.amount.toString(),
    notes: invoice.notes,
    lineItems,
    client: invoice.client,
    user: {
      name: invoice.user.name ?? "Unknown",
      email: invoice.user.email ?? "",
      company: invoice.user.company,
      phone: invoice.user.phone,
    },
  };

  const stream = await renderToStream(
    createElement(InvoiceDocument, { data }) as ReactElement<DocumentProps>
  );

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  const filename = `${invoice.invoiceNumber}.pdf`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.byteLength.toString(),
      "Cache-Control": "no-store",
    },
  });
}
