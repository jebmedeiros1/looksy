import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const look = await prisma.look.findFirst({ where: { id, userId: session.user.id } });
  if (!look) return NextResponse.json({ error: "Look não encontrado" }, { status: 404 });

  const updated = await prisma.look.update({
    where: { id },
    data: {
      ...(body.feeling !== undefined && { feeling: body.feeling }),
      ...(body.feelingEmoji !== undefined && { feelingEmoji: body.feelingEmoji }),
      ...(body.wornAt !== undefined && { wornAt: body.wornAt ? new Date(body.wornAt) : null }),
      ...(body.saved !== undefined && { saved: body.saved }),
    },
  });

  return NextResponse.json({ ok: true, id: updated.id });
}
