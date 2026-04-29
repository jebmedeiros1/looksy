import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decryptField, encryptField } from "@/lib/crypto";
import { buildOtpAuthUrl, generateTotpSecret, verifyTotpCode } from "@/lib/totp";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  return NextResponse.json({ enabled: Boolean(user?.twoFactorEnabled) });
}

export async function POST() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  if (user?.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA ja esta ativo" }, { status: 409 });
  }

  const secret = generateTotpSecret();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecretEncrypted: encryptField(secret),
      twoFactorEnabled: false,
    },
  });

  return NextResponse.json({
    secret,
    otpauthUrl: buildOtpAuthUrl({ secret, email: session.user.email }),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { code } = await req.json();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecretEncrypted: true },
  });

  if (!user?.twoFactorSecretEncrypted) {
    return NextResponse.json({ error: "Configure o 2FA antes de ativar" }, { status: 400 });
  }

  const secret = decryptField(user.twoFactorSecretEncrypted);

  if (!verifyTotpCode(secret, String(code ?? ""))) {
    return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: true },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { code } = await req.json();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecretEncrypted: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecretEncrypted) {
    return NextResponse.json({ ok: true });
  }

  const secret = decryptField(user.twoFactorSecretEncrypted);

  if (!verifyTotpCode(secret, String(code ?? ""))) {
    return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: false, twoFactorSecretEncrypted: null },
  });

  return NextResponse.json({ ok: true });
}
