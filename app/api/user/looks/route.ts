import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Look } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rows = await prisma.look.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const items: Look[] = rows.map((l) => ({
    id: l.id,
    name: l.name,
    garments: JSON.parse(l.garmentsJson),
    moodTags: JSON.parse(l.moodTags),
    explanation: l.explanation,
    eventContext: l.eventContext,
    saved: l.saved,
    createdAt: l.createdAt.toISOString(),
  }));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const look: Look = await req.json();

  await prisma.look.upsert({
    where: { id: look.id },
    create: {
      id: look.id,
      userId: session.user.id,
      name: look.name,
      garmentsJson: JSON.stringify(look.garments),
      moodTags: JSON.stringify(look.moodTags),
      explanation: look.explanation,
      eventContext: look.eventContext,
      saved: look.saved,
      createdAt: new Date(look.createdAt),
    },
    update: { saved: look.saved },
  });

  return NextResponse.json({ ok: true });
}
