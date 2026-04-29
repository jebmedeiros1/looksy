import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { hashEmail, decryptField } from "./crypto";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        twoFactorCode: { label: "Codigo 2FA", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const emailHash = hashEmail(credentials.email as string);
        const user = await prisma.user.findUnique({ where: { emailHash } });
        if (!user || user.deletedAt) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        if (user.twoFactorEnabled) {
          if (!user.twoFactorSecretEncrypted || !credentials.twoFactorCode) {
            return null;
          }

          const secret = decryptField(user.twoFactorSecretEncrypted);
          const { verifyTotpCode } = await import("./totp");
          const validCode = verifyTotpCode(secret, credentials.twoFactorCode as string);

          if (!validCode) {
            return null;
          }
        }

        return {
          id: user.id,
          email: decryptField(user.emailEncrypted),
          name: user.nameEncrypted ? decryptField(user.nameEncrypted) : null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});
