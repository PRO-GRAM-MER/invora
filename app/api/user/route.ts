import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  company: z.string().max(100, "Company name too long").optional().or(z.literal("")),
  phone: z
    .string()
    .max(20, "Phone number too long")
    .regex(/^[+\d\s\-().]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
});

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  company: true,
  phone: true,
  createdAt: true,
} as const;

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: USER_SELECT,
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...user, createdAt: user.createdAt.toISOString() });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, company, phone } = parsed.data;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      company: company || null,
      phone: phone || null,
    },
    select: USER_SELECT,
  });

  return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString() });
}
