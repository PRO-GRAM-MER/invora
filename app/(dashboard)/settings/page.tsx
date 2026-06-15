import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsView } from "@/components/settings/SettingsView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, company: true, phone: true, createdAt: true },
  });

  return (
    <SettingsView
      user={{
        ...user!,
        createdAt: user!.createdAt.toISOString(),
      }}
    />
  );
}
