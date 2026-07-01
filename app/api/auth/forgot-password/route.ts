import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { hashEmail } from "@/lib/crypto";

const RESET_TOKEN_MINUTES = 60;

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (email) {
    const user = await prisma.user.findUnique({
      where: { emailHash: hashEmail(String(email)) },
      select: { id: true, deletedAt: true },
    });

    if (user && !user.deletedAt) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = hashResetToken(token);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const resetUrl = `/auth/reset-password?token=${encodeURIComponent(token)}`;

      // Only expose the URL in local development — never on deployed envs (including preview).
      const isLocalDev =
        process.env.NODE_ENV === "development" &&
        (process.env.NEXTAUTH_URL ?? "").includes("localhost");
      if (isLocalDev) {
        return NextResponse.json({ ok: true, resetUrl });
      }

      // Plug an email provider here in production.
      console.info("Password reset requested", { userId: user.id, resetUrl });
    }
  }

  return NextResponse.json({ ok: true });
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
