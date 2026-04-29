import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PWARegister from "@/components/PWARegister";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "Looksy - Veste-se com Consciencia",
    template: "%s | Looksy",
  },
  description: "Descubra a linguagem simbolica do seu vestir com inteligencia artificial.",
  applicationName: "Looksy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Looksy",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider session={session}>
          <PWARegister />
          <Navbar />
          <main className="min-h-screen pt-16">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
