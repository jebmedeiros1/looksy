import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WardrobeStore } from "@/lib/types";

function decryptName(user: { nameEncrypted: string | null }): string {
  // Return a display-safe name (decryption would require the crypto key; use placeholder here)
  return user.nameEncrypted ? "Usuária Looksy" : "Usuária Looksy";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";

  const stores = await prisma.wardrobeStore.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { nameEncrypted: true } },
      clones: { select: { id: true } },
    },
    take: 50,
  });

  const result: WardrobeStore[] = stores
    .filter((s) => {
      if (!query) return true;
      const tags: string[] = JSON.parse(s.tags);
      return (
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        tags.some((t) => t.toLowerCase().includes(query))
      );
    })
    .map((s) => ({
      id: s.id,
      userId: s.userId,
      ownerName: decryptName(s.user),
      name: s.name,
      description: s.description,
      tags: JSON.parse(s.tags),
      garments: JSON.parse(s.garmentsSnapshot),
      views: s.views,
      clones: s.clones.length,
      createdAt: s.createdAt.toISOString(),
    }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json() as {
    name: string;
    description: string;
    tags: string[];
    garmentIds: string[];
  };

  if (!body.name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  if (!body.garmentIds?.length) return NextResponse.json({ error: "Selecione ao menos uma peça" }, { status: 400 });

  const garments = await prisma.garment.findMany({
    where: { userId: session.user.id, id: { in: body.garmentIds } },
  });

  const garmentsSnapshot = garments.map((g) => ({
    id: g.id,
    imageUrl: g.imageUrl,
    type: g.type,
    color: g.color,
    colorHex: g.colorHex,
    style: JSON.parse(g.style),
    occasions: JSON.parse(g.occasions),
    season: g.season,
    material: g.material ?? undefined,
    confidence: g.confidence ?? undefined,
    length: g.length ?? undefined,
    fit: g.fit ?? undefined,
    createdAt: g.createdAt.toISOString(),
  }));

  const store = await prisma.wardrobeStore.create({
    data: {
      userId: session.user.id,
      name: body.name.trim(),
      description: (body.description ?? "").trim(),
      tags: JSON.stringify(body.tags ?? []),
      garmentsSnapshot: JSON.stringify(garmentsSnapshot),
    },
  });

  return NextResponse.json({ ok: true, id: store.id });
}
