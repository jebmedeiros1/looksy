import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GarmentItem } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rows = await prisma.garment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const items: GarmentItem[] = rows.map((g) => ({
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

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const item: GarmentItem = await req.json();

  await prisma.garment.create({
    data: {
      id: item.id,
      userId: session.user.id,
      imageUrl: item.imageUrl,
      type: item.type,
      color: item.color,
      colorHex: item.colorHex,
      style: JSON.stringify(item.style),
      occasions: JSON.stringify(item.occasions),
      season: item.season,
      material: item.material,
      confidence: item.confidence,
      length: item.length,
      fit: item.fit,
      createdAt: new Date(item.createdAt),
    },
  });

  return NextResponse.json({ ok: true });
}
