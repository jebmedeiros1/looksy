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
    feeling: l.feeling ?? undefined,
    feelingEmoji: l.feelingEmoji ?? undefined,
    wornAt: l.wornAt?.toISOString() ?? undefined,
    createdAt: l.createdAt.toISOString(),
  }));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const look: Look = await req.json();

  const existing = await prisma.look.findFirst({
    where: { id: look.id, userId: session.user.id },
  });

  if (existing) {
    await prisma.look.update({
      where: { id: look.id },
      data: { saved: look.saved },
    });
  } else {
    await prisma.look.create({
      data: {
        id: look.id,
        userId: session.user.id,
        name: look.name ?? "",
        garmentsJson: JSON.stringify(look.garments ?? []),
        moodTags: JSON.stringify(look.moodTags ?? []),
        explanation: look.explanation ?? "",
        eventContext: look.eventContext ?? "",
        saved: look.saved ?? false,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
