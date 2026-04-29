import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token e senha sao obrigatorios" }, { status: 400 });
  }

  if (String(password).length < 8) {
    return NextResponse.json({ error: "Senha deve ter ao menos 8 caracteres" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(String(token)).digest("hex");
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Link invalido ou expirado" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(String(password), 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
