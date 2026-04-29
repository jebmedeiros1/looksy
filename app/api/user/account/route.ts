import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// LGPD: right to erasure — deletes all user data (cascades to garments, looks, knowledge)
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ ok: true });
}

// LGPD: data export
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const [garments, looks, knowledgeFiles] = await Promise.all([
    prisma.garment.findMany({ where: { userId: session.user.id } }),
    prisma.look.findMany({ where: { userId: session.user.id } }),
    prisma.knowledgeFile.findMany({ where: { userId: session.user.id } }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    garments: garments.map((g) => ({
      id: g.id,
      type: g.type,
      color: g.color,
      season: g.season,
      createdAt: g.createdAt,
    })),
    looks: looks.map((l) => ({
      id: l.id,
      name: l.name,
      eventContext: l.eventContext,
      saved: l.saved,
      createdAt: l.createdAt,
    })),
    knowledgeFiles: knowledgeFiles.map((f) => ({
      filename: f.filename,
      content: f.content,
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="looksy-meus-dados.json"',
    },
  });
}
