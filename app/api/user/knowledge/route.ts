import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const files = await prisma.knowledgeFile.findMany({
    where: { userId: session.user.id },
    orderBy: { filename: "asc" },
  });

  return NextResponse.json(files.map((f) => ({ filename: f.filename, content: f.content })));
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { filename, content } = await req.json();
  if (!filename || content === undefined) {
    return NextResponse.json({ error: "filename e content são obrigatórios" }, { status: 400 });
  }

  await prisma.knowledgeFile.upsert({
    where: { userId_filename: { userId: session.user.id, filename } },
    create: { userId: session.user.id, filename, content },
    update: { content },
  });

  return NextResponse.json({ ok: true });
}
