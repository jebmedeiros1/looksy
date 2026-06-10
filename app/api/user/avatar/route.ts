import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AvatarConfig } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarType: true, avatarConfig: true },
  });

  if (!user?.avatarType || !user?.avatarConfig) {
    return NextResponse.json({ avatar: null });
  }

  const avatar: AvatarConfig = JSON.parse(user.avatarConfig);
  return NextResponse.json({ avatar });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body: AvatarConfig | null = await req.json();

  if (body === null) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarType: null, avatarConfig: null },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.type !== "mannequin" && body.type !== "photo") {
    return NextResponse.json({ error: "Tipo de avatar inválido" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarType: body.type, avatarConfig: JSON.stringify(body) },
  });

  return NextResponse.json({ ok: true });
}
