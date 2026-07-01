import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GarmentItem } from "@/lib/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const store = await prisma.wardrobeStore.findUnique({ where: { id } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  if (store.userId === session.user.id) {
    return NextResponse.json({ error: "Você não pode clonar seu próprio guarda-roupa" }, { status: 400 });
  }

  const alreadyCloned = await prisma.storeClone.findUnique({
    where: { storeId_clonedByUserId: { storeId: id, clonedByUserId: session.user.id } },
  });
  if (alreadyCloned) {
    return NextResponse.json({ error: "Você já clonou este guarda-roupa" }, { status: 409 });
  }

  const garments: GarmentItem[] = JSON.parse(store.garmentsSnapshot);

  // Create new garments for the cloning user with new IDs
  const now = new Date();
  await prisma.garment.createMany({
    data: garments.map((g) => ({
      userId: session.user!.id,
      imageUrl: g.imageUrl,
      type: g.type,
      color: g.color,
      colorHex: g.colorHex,
      style: JSON.stringify(g.style),
      occasions: JSON.stringify(g.occasions),
      season: g.season,
      material: g.material ?? null,
      confidence: g.confidence ?? null,
      length: g.length ?? null,
      fit: g.fit ?? null,
      createdAt: now,
    })),
  });

  // Record the clone
  await prisma.storeClone.create({
    data: { storeId: id, clonedByUserId: session.user.id },
  });

  return NextResponse.json({ ok: true, count: garments.length });
}
