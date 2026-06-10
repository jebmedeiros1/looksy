"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Sparkles, ShirtIcon, Wand2, Brain, LogOut, UserCircle, Store } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/wardrobe", label: "Guarda-Roupa", icon: ShirtIcon },
  { href: "/generate", label: "Compor Look", icon: Wand2 },
  { href: "/store", label: "Loja", icon: Store },
  { href: "/knowledge", label: "Essência", icon: Brain },
];

export default function Navbar() {
  const path = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-brand-800">
          <Sparkles className="w-5 h-5 text-accent-500" />
          Looksy
        </Link>

        <div className="flex items-center gap-1">
          {session && links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                path === href
                  ? "bg-brand-700 text-white shadow"
                  : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}

          {session ? (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-200">
              <Link
                href="/profile"
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                  path === "/profile"
                    ? "bg-brand-700 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                )}
                title={session.user?.email ?? "Perfil"}
              >
                <UserCircle className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {session.user?.name ?? session.user?.email?.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link href="/auth/login" className="btn-secondary text-sm py-2">Entrar</Link>
              <Link href="/auth/register" className="btn-primary text-sm py-2">Criar conta</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
