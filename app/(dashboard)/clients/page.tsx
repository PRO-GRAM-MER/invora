import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClientsView } from "@/components/clients/ClientsView";
import type { Metadata } from "next";
import type { Client } from "@/lib/stores/clientStore";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const session = await auth();

  const raw = await prisma.client.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates — Prisma returns Date objects, client needs strings
  const clients: Client[] = raw.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return <ClientsView initialClients={clients} />;
}
