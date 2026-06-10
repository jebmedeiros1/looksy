import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WardrobeStore } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const store = await prisma.wardrobeStore.findUnique({
    where: { id },
    include: {
      user: { select: { nameEncrypted: true } },
      clones: { select: { id: true } },
    },
  });

  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  // Increment view count (fire-and-forget)
  prisma.wardrobeStore.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

  const result: WardrobeStore = {
    id: store.id,
    userId: store.userId,
    ownerName: "Usuária Looksy",
    name: store.name,
    description: store.description,
    tags: JSON.parse(store.tags),
    garments: JSON.parse(store.garmentsSnapshot),
    views: store.views,
    clones: store.clones.length,
    createdAt: store.createdAt.toISOString(),
  };

  return NextResponse.json(result);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const store = await prisma.wardrobeStore.findFirst({ where: { id, userId: session.user.id } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  await prisma.wardrobeStore.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
